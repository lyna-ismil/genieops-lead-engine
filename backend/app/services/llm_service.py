from __future__ import annotations
import json
import re
import logging
from typing import Any, Optional
import httpx
from app.models.schemas import ICPProfile, LeadMagnetIdea, GeneratedAsset, LandingPageConfig, Email, ProductContext
from app.models.schemas import Settings as SettingsSchema
from app.services.image_service import search_stock_image


logger = logging.getLogger(__name__)


# Task 1.1 (P0): Strict Negative Constraints (Kill List)
# If any of these appear in output copy, we treat it as a failure.
BANNED_MARKETING_WORDS: list[str] = [
    # The explicit offenders
    "seamless",
    "unlock",
    "unleash",
    "elevate",
    "streamline",
    # Common generic fluff
    "empower",
    "revolutionize",
    "game changer",
    "game-changer",
    "cutting-edge",
    "innovative",
    "next-level",
    "transform",
    "transformative",
    "leverage",
    "synergy",
    "world-class",
    "best-in-class",
    "robust",
    "scalable",
    "end-to-end",
    "comprehensive",
    "all-in-one",
]

BANNED_MARKETING_REPLACEMENTS: dict[str, str] = {
    "seamless": "simple",
    "unlock": "get",
    "unleash": "use",
    "elevate": "improve",
    "streamline": "reduce steps",
    "empower": "enable",
    "revolutionize": "change",
    "game changer": "meaningful shift",
    "game-changer": "meaningful shift",
    "cutting-edge": "practical",
    "innovative": "specific",
    "next-level": "more effective",
    "transform": "change",
    "transformative": "measurable",
    "leverage": "use",
    "synergy": "coordination",
    "world-class": "high-quality",
    "best-in-class": "high-quality",
    "robust": "reliable",
    "scalable": "repeatable",
    "end-to-end": "from start to finish",
    "comprehensive": "complete",
    "all-in-one": "single",
}


def _normalize_for_ban_check(text: str) -> str:
    lowered = (text or "").lower()
    lowered = lowered.replace("-", " ")
    return re.sub(r"\s+", " ", lowered).strip()


def _find_banned_marketing_words(text: str) -> list[str]:
    if not text:
        return []
    hay = _normalize_for_ban_check(text)
    found: list[str] = []
    for raw in BANNED_MARKETING_WORDS:
        needle = _normalize_for_ban_check(raw)
        if needle and needle in hay:
            found.append(raw)
    # Stable order, unique
    seen: set[str] = set()
    uniq: list[str] = []
    for w in found:
        if w not in seen:
            seen.add(w)
            uniq.append(w)
    return uniq


def _find_banned_in_obj(obj: Any) -> list[str]:
    found: list[str] = []
    if isinstance(obj, str):
        return _find_banned_marketing_words(obj)
    if isinstance(obj, dict):
        for v in obj.values():
            found.extend(_find_banned_in_obj(v))
    elif isinstance(obj, list):
        for item in obj:
            found.extend(_find_banned_in_obj(item))
    # unique
    seen: set[str] = set()
    uniq: list[str] = []
    for w in found:
        if w not in seen:
            seen.add(w)
            uniq.append(w)
    return uniq


def _rewrite_banned_in_text(text: str) -> str:
    if not text:
        return text
    out = text
    for raw in sorted(BANNED_MARKETING_WORDS, key=len, reverse=True):
        repl = BANNED_MARKETING_REPLACEMENTS.get(raw.lower())
        if repl is None:
            repl = ""
        # Replace case-insensitively; tolerate hyphen/space variants.
        pattern = re.escape(raw).replace(r"\-", r"[\-\s]")
        out = re.sub(pattern, repl, out, flags=re.IGNORECASE)
    out = re.sub(r"\s+", " ", out).strip()
    # Clean up awkward punctuation spacing after removals.
    out = re.sub(r"\s+([,.;:!?])", r"\1", out)
    out = re.sub(r"\(\s+", "(", out)
    out = re.sub(r"\s+\)", ")", out)
    return out


def _rewrite_banned_in_obj(obj: Any, *, skip_keys: set[str] | None = None) -> Any:
    if skip_keys is None:
        skip_keys = set()
    if isinstance(obj, str):
        return _rewrite_banned_in_text(obj)
    if isinstance(obj, list):
        return [_rewrite_banned_in_obj(item, skip_keys=skip_keys) for item in obj]
    if isinstance(obj, dict):
        new_obj: dict[str, Any] = {}
        for k, v in obj.items():
            if isinstance(k, str) and k in skip_keys:
                new_obj[k] = v
            else:
                new_obj[k] = _rewrite_banned_in_obj(v, skip_keys=skip_keys)
        return new_obj
    return obj


def _banned_words_instruction() -> str:
    words = ", ".join(sorted(set(BANNED_MARKETING_WORDS)))
    return (
        "\n\nSTRICT NEGATIVE CONSTRAINT (KILL LIST):\n"
        f"BANNED WORDS/PHRASES (case-insensitive): {words}\n"
        "If you use ANY banned word/phrase anywhere in the output, the generation is considered a FAILURE.\n"
        "Rewrite until none appear."
    )


def _find_banned_phrases(text: str) -> list[str]:
    # Back-compat for existing critic logic.
    return _find_banned_marketing_words(text)


def _coerce_openai_model(model: str | None, *, json_mode: bool) -> str:
    """Coerce configured model names (including legacy placeholders) into valid OpenAI model IDs."""
    default = "gpt-4o-mini" if not json_mode else "gpt-4o-mini"
    candidate = (model or "").strip()
    if not candidate:
        return default

    # Legacy/internal placeholders that should never reach the provider.
    lowered = candidate.lower()
    if lowered in {"gbt-5.2"}:
        return "gpt-4o" if json_mode else "gpt-4o-mini"

    # Heuristic allow: most OpenAI model IDs start with gpt- or o-.
    if lowered.startswith("gpt-") or lowered.startswith("o"):
        return candidate

    return default


class LLMProviderError(RuntimeError):
    def __init__(self, provider: str, message: str, status_code: int = 502, details: str | None = None):
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code
        self.details = details


def _extract_json(text: str) -> Any:
    if not text:
        return None

    text = _clean_markdown_json(text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start_obj = text.find("{")
    end_obj = text.rfind("}")
    if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
        try:
            return json.loads(text[start_obj : end_obj + 1])
        except json.JSONDecodeError:
            pass

    start_arr = text.find("[")
    end_arr = text.rfind("]")
    if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
        try:
            return json.loads(text[start_arr : end_arr + 1])
        except json.JSONDecodeError:
            pass

    return None


def _clean_markdown_json(text: str) -> str:
    """Remove markdown code fences (```json ... ```) if present."""
    if not text:
        return text
    cleaned = text.strip()
    cleaned = re.sub(r"```(?:json)?\s*(.*?)\s*```", r"\1", cleaned, flags=re.DOTALL | re.IGNORECASE)
    return cleaned.strip()


def _clean_citations(text: str) -> str:
    """Remove citation artifacts like [1], [2], [1][2] from generated text."""
    if not text:
        return text
    return re.sub(r'\[\d+\]', '', text)


def _clean_dict_citations(obj: Any) -> Any:
    """Recursively clean citation artifacts from strings in a dict/list."""
    if isinstance(obj, str):
        return _clean_citations(obj)
    elif isinstance(obj, dict):
        return {k: _clean_dict_citations(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_clean_dict_citations(item) for item in obj]
    return obj


async def review_copy(
    client: "LLMClient",
    copy: str,
    unique_mechanism: str | None = None,
    context: str = ""
) -> dict:
    """
    Review generated copy for genericness and ensure unique mechanism is mentioned.
    Hardened rules:
    - Enforces a kill-list of banned phrases.
    - Always returns a numeric score (1-10).
    - If score < 7 or banned phrases are found, triggers a second rewrite loop.
    Returns: {"is_generic": bool, "improved_version": str, "feedback": str, "score": int}
    """

    found_banned = _find_banned_phrases(copy)
    banned_list = ", ".join(BANNED_MARKETING_WORDS)
    found_list = ", ".join(found_banned) if found_banned else "(none)"

    review_prompt = f"""
You are a critical copy editor reviewing marketing copy for quality and specificity.

COPY TO REVIEW:
{copy}

CONTEXT:
{context}

KILL LIST (BANNED PHRASES):
{banned_list}

EVALUATION TASKS (STRICT):
1. If the headline could apply to a competitor, reject it.
2. Flag any banned phrases (case-insensitive). Found in input: {found_list}
3. Check for generic/vague language (no specifics, no mechanism, no metrics).
4. Require concrete language: specific nouns + at least one metric when rewriting.
"""

    if unique_mechanism:
        review_prompt += f"""

CRITICAL CHECK:
Does this copy mention the Unique Mechanism exactly or clearly: "{unique_mechanism}"?
"""

    review_prompt += f"""

OUTPUT REQUIREMENTS:
Return STRICT JSON with these exact fields:
{{
  "is_generic": boolean,
  "score": number,  // integer 1-10
  "improved_version": string,
  "feedback": string
}}

SCORING RULES:
- If ANY banned phrase appears in the copy, score MUST be <= 6 and is_generic MUST be true.
- If Unique Mechanism is provided but missing, score MUST be <= 6 and is_generic MUST be true.

MANDATORY REWRITE RULES (if is_generic = true OR banned phrases are present):
- Rewrite to be ~20% shorter.
- Replace each banned phrase with a specific metric (%, $, hours, days) OR a concrete noun phrase.
- Add at least one metric.
- Make it competitor-specific so it cannot apply to rivals.
- Do not include any of the banned phrases in the improved_version.
"""

    first = await client.generate_json(review_prompt)
    if not isinstance(first, dict):
        first = {}

    first = _clean_dict_citations(first)
    is_generic = bool(first.get("is_generic"))

    score_raw = first.get("score")
    try:
        score = int(score_raw)
    except Exception:
        score = 5 if found_banned else 8

    improved = (first.get("improved_version") if isinstance(first.get("improved_version"), str) else "")
    if not improved:
        improved = copy

    improved_has_banned = bool(_find_banned_phrases(improved))

    # Local enforcement: banned phrases force rewrite behavior.
    if found_banned:
        is_generic = True
        score = min(score, 6)

    needs_second_pass = (score < 7) or is_generic or improved_has_banned

    if needs_second_pass:
        rewrite_prompt = _as_json_prompt(
            f"""
You are rewriting copy to eliminate banned phrases and remove generic claims.

BANNED PHRASES:
{banned_list}

INPUT COPY:
{copy}

CONTEXT:
{context}

REWRITE REQUIREMENTS:
- Output MUST NOT include any banned phrase (case-insensitive).
- Replace each banned phrase with a specific metric OR a concrete noun phrase.
- Must include at least one metric (%, $, hours, days).
- Keep it ~20% shorter.
""" + (f"\n- Must mention Unique Mechanism: {unique_mechanism}\n" if unique_mechanism else "") + """

Return STRICT JSON with this exact shape:
{
  "score": 1,
  "improved_version": "...",
  "feedback": "..."
}

Scoring: If the output still has any banned phrase, score MUST be <= 3.
""",
            "",
        )

        second = await client.generate_json(rewrite_prompt)
        if isinstance(second, dict):
            second = _clean_dict_citations(second)
            improved2 = second.get("improved_version") if isinstance(second.get("improved_version"), str) else ""
            if improved2:
                improved = improved2
            score2_raw = second.get("score")
            try:
                score2 = int(score2_raw)
            except Exception:
                score2 = score
            score = score2
            feedback = second.get("feedback") if isinstance(second.get("feedback"), str) else ""
        else:
            feedback = first.get("feedback") if isinstance(first.get("feedback"), str) else ""

        # Final safeguard: if we STILL see banned phrases, mark as generic.
        if _find_banned_phrases(improved):
            is_generic = True
            score = min(score, 3)
    else:
        feedback = first.get("feedback") if isinstance(first.get("feedback"), str) else ""

    return {
        "is_generic": bool(is_generic),
        "score": int(max(1, min(10, score))),
        "improved_version": improved,
        "feedback": feedback or "",
    }


class LLMClient:
    def __init__(self, settings: SettingsSchema):
        self.settings = settings

    async def generate_json(self, prompt: str, *, system_role: str | None = None) -> Any:
        return await self._openai_json(prompt, system_role=system_role)

    async def generate_text(self, prompt: str, *, model_override: str | None = None) -> str:
        return await self._openai_text(prompt, model_override=model_override)

    async def _openai_json(self, prompt: str, *, system_role: str | None = None) -> Any:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")
        model = _coerce_openai_model(self.settings.llm_model, json_mode=True)
        sys_content = system_role or "You are a helpful assistant designed to output valid JSON."
        payload = {
            "model": model,
            "temperature": self.settings.llm_temperature or 0.4,
            "max_tokens": self.settings.llm_max_tokens or 2048,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": sys_content},
                {"role": "user", "content": prompt},
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                    json=payload,
                )
                if response.status_code != 200:
                    print(f"OPENAI ERROR ({response.status_code}): {response.text}")
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            details = f"{exc.response.status_code} {exc.response.text}" if exc.response is not None else str(exc)
            raise LLMProviderError("openai", "OpenAI API request failed", status_code=502, details=details) from exc
        except httpx.HTTPError as exc:
            raise LLMProviderError("openai", "OpenAI API request failed", status_code=502, details=str(exc)) from exc
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        text = _clean_citations(text)
        text = _clean_markdown_json(text)
        return _extract_json(text)

    async def _openai_text(self, prompt: str, *, model_override: str | None = None) -> str:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")
        model = model_override or _coerce_openai_model(self.settings.llm_model, json_mode=False)
        payload = {
            "model": model,
            "temperature": self.settings.llm_temperature or 0.4,
            "max_tokens": self.settings.llm_max_tokens or 2048,
            "messages": [
                {"role": "user", "content": prompt},
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                    json=payload,
                )
                if response.status_code != 200:
                    print(f"OPENAI ERROR ({response.status_code}): {response.text}")
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            details = f"{exc.response.status_code} {exc.response.text}" if exc.response is not None else str(exc)
            raise LLMProviderError("openai", "OpenAI API request failed", status_code=502, details=details) from exc
        except httpx.HTTPError as exc:
            raise LLMProviderError("openai", "OpenAI API request failed", status_code=502, details=str(exc)) from exc
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return _clean_citations(text)


def _as_json_prompt(instructions: str, payload: str) -> str:
    return f"""{instructions}

Return strictly valid JSON and nothing else.

Context:
{payload}
"""


def _voice_profile_instruction(product_context: ProductContext | None) -> str:
    """Return an instruction block that forces the model to mimic the detected writing vibe."""
    if not product_context or not getattr(product_context, "voice_profile", None):
        return ""
    vp = product_context.voice_profile
    sentence_length = (vp.sentence_length or "").strip()
    jargon_level = (vp.jargon_level or "").strip()
    banned = vp.banned_words or []
    banned_list = ", ".join([w for w in banned if isinstance(w, str) and w.strip()][:15])

    style_line = "Mimic this writing style:"
    if sentence_length or jargon_level:
        style_line += f" {sentence_length or 'mixed'} sentences, {jargon_level or 'mixed'} vocabulary."
    else:
        style_line += " match the site's sentence rhythm and vocabulary."

    block = f"\n\nSTYLE INSTRUCTION (Vibe Decoder): {style_line}"
    if banned_list:
        block += f"\nAvoid these clichés found on the site: {banned_list}."
    return block


async def _generate_lp_strategy(client: "LLMClient", context: str) -> dict:
    """Strategist step: generate anti-objection angle + hook + objection handling copy."""
    prompt = _as_json_prompt(
        """
You are a direct-response conversion strategist.

You are not allowed to use generic marketing fluff. If you use any banned word, the generation is a failure.
""" + _banned_words_instruction() + """

Prompt:
Identify the #1 objection this ICP has to this offer. Write a headline that attacks that objection directly.

Return STRICT JSON with this exact shape:
{
  "objection": "string",
  "angle": "string",
  "antiObjectionHeadline": "string",
  "hook": "string",
  "objectionHandling": ["string", "string", "string"]
}

Rules:
- The objection must be concrete (time, trust, complexity, switching costs, "sounds like everyone else", etc).
- The antiObjectionHeadline must directly negate or reframe the objection.
- hook should be 1-3 short paragraphs (no fluff).
- objectionHandling should be crisp, specific, and non-generic.
""",
        context,
    )
    strategy = await client.generate_json(prompt) or {}
    return _clean_dict_citations(strategy)


def _normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def _title_has_mechanism(title: str) -> bool:
    """Heuristic: ensure the title contains a 'mechanism' word so it isn't generic."""
    t = (title or "").lower()
    mechanism_terms = [
        "audit",
        "scorecard",
        "blueprint",
        "playbook",
        "framework",
        "system",
        "protocol",
        "method",
        "formula",
        "engine",
        "dashboard",
        "calculator",
        "template",
        "tracker",
        "swipe file",
        "script",
        "sprint",
        "diagnostic",
        "assessment",
        "matrix",
    ]
    return any(term in t for term in mechanism_terms)


def _extract_formula_vars(formula: str) -> set[str]:
    if not formula:
        return set()
    # Variables are simple identifiers used by our calculator DSL.
    tokens = re.findall(r"[A-Za-z_][A-Za-z0-9_]*", formula)
    return set(tokens)


def _is_simple_arithmetic(formula: str) -> bool:
    if formula is None:
        return False
    # Allow identifiers, numbers, whitespace, operators, parentheses, and ^.
    return bool(re.fullmatch(r"[A-Za-z0-9_\s\+\-\*\/\^\(\)\.]+", formula.strip()))


def _why_refs_any_weakness(why: str, weaknesses: list[str]) -> bool:
    why_l = (why or "").lower()
    for w in weaknesses:
        w_l = (w or "").lower().strip()
        if not w_l:
            continue
        # match on a meaningful fragment to avoid brittle exact matches
        fragment = w_l
        if len(fragment) > 80:
            fragment = fragment[:80]
        if fragment in why_l:
            return True
    return False


async def ideate_lead_magnets(
    client: LLMClient, 
    icp: ICPProfile, 
    product_context: ProductContext | None = None,
    offer_type: str | None = None, 
    brand_voice: str | None = None, 
    target_conversion: str | None = None
) -> list[dict]:
    context = f"ICP role: {icp.role}\nIndustry: {icp.industry}\nCompany size: {icp.company_size}\nPain points: {', '.join(icp.pain_points)}\nGoals: {', '.join(icp.goals)}"
    if product_context and product_context.unique_mechanism:
        context += f"\nUnique Mechanism: {product_context.unique_mechanism}"
    if offer_type:
        context += f"\nOffer Type: {offer_type}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if target_conversion:
        context += f"\nTarget Goal: {target_conversion}"

    vibe_constraint = _voice_profile_instruction(product_context)

    branding_rule = ""
    competitor_rule = ""
    mechanism_phrase = (product_context.unique_mechanism if product_context else "") or ""
    mechanism_phrase = mechanism_phrase.strip()
    if product_context and product_context.unique_mechanism:
        branding_rule = (
            f"\n\nBRANDING RULE (MANDATORY): At least 2 of the 3 ideas MUST contain the EXACT phrase '{product_context.unique_mechanism}' in the title.\n"
            "BAD: 'Cybersecurity Checklist'\n"
            f"GOOD: 'The [{product_context.unique_mechanism}] Pre-Audit Checklist'"
        )
    if product_context and product_context.competitor_contrast:
        competitor_rule = (
            "\n\nCOMPETITOR CONTRAST RULE: Analyze the provided 'Competitor Contrast'. "
            "Your ideas must explicitly attack the weaknesses of these competitors. "
            f"Competitor Contrast: {product_context.competitor_contrast}"
        )

    # Step 1: Market gap / contrarian truth extraction (short, structured output only)
    competitor_contrast = (product_context.competitor_contrast if product_context else "") or ""
    step1_payload = context
    if competitor_contrast:
        step1_payload += f"\n\nCompetitor Contrast: {competitor_contrast}"

        step1 = _as_json_prompt(
                """Step 1 (Market Gap): Analyze the Unique Mechanism and the Competitor Contrast.

You are a Contrarian Marketing Strategist.

Output 3 competitor weaknesses (specific failures) that:
- make the Unique Mechanism feel necessary (i.e., what competitors fail to do)
- are concrete enough to quote in a whyItWorks sentence

Return JSON with this exact shape:
{
  "competitor_weaknesses": [
    {
      "weakness": "...",
      "annoyance": "..."
    }
  ]
}

Rules:
- Be concrete (avoid vague words like 'generic', 'bad UX', 'inefficient' without specifics).
- Each 'weakness' must be 8-20 words.
- Each 'annoyance' must be 6-18 words.
- If Competitor Contrast is missing/empty, infer common competitor mistakes in this ICP's market.
""",
        step1_payload,
    )

    step1_data = await client.generate_json(step1, system_role="Contrarian Marketing Strategist") or {}
    weaknesses_block = step1_data.get("competitor_weaknesses") if isinstance(step1_data, dict) else None
    if not isinstance(weaknesses_block, list):
        weaknesses_block = []

    weaknesses: list[str] = []
    for item in weaknesses_block[:3]:
        if not isinstance(item, dict):
            continue
        w = _normalize_ws(str(item.get("weakness") or ""))
        a = _normalize_ws(str(item.get("annoyance") or ""))
        if w:
            weaknesses.append(w)
        # keep annoyance as context, but the acceptance criteria focuses on referencing weakness
        if a and w:
            weaknesses[-1] = f"{w} (annoys ICP because: {a})"

    if not weaknesses:
        weaknesses = [
            "Competitors force one-size-fits-all templates that ignore this ICP's real constraints",
            "Competitors bury the 'how' behind buzzwords, leaving teams without an actionable mechanism",
            "Competitors optimize for vanity metrics, not the operational outcome this ICP is judged on",
        ]

    weaknesses_context = "\n".join([f"- {w}" for w in weaknesses])

    # Step 2: Generate ideas that explicitly leverage those weaknesses.
    title_rule = (
        "\n\nTITLE RULE (STRICT): Titles must follow a 'Benefit + Mechanism' structure. "
        "A mechanism is the named method/tool (Audit, Scorecard, Blueprint, System, Protocol, Calculator, Template, etc.). "
        "Examples: 'The Pipeline Leak Detector Audit', 'The No-Spam Outreach Scorecard', 'The [Unique Mechanism] Audit'. "
        "Bad: 'Marketing Checklist', 'Email Template', 'Lead Gen Guide'."
    )

    prompt = _as_json_prompt(
        f"""Generate 3 high-conversion lead magnet ideas.

You MUST ground each idea in one of the competitor weaknesses listed below.

COMPETITOR WEAKNESSES (use these as the anchor):
{weaknesses_context}

Output strictly valid JSON with this exact shape: {{ "ideas": [ ... ] }}.

Each item in ideas must be an object with these EXACT field names (camelCase):
- title (string): Benefit + Mechanism title.{title_rule}
- type (string): One of: checklist, template, calculator, report, other
- painPointAlignment (string): Which pain point this addresses (should reference the competitor weakness or the annoyance)
- valuePromise (string): Clear value proposition
- conversionScore (number): 1-10 estimated conversion rate
- formatRecommendation (string): Suggested delivery format
- whyItWorks (string): 1-2 sentences. MUST explicitly reference one competitor weakness (quote or closely paraphrase it) and explain how this idea fixes it.
- strategySummary (object): A compact strategy the rest of the funnel must reuse. Must be strict JSON with keys:
    - objection (string): the #1 objection this ICP has to taking action on this offer
    - angle (string): the positioning angle that answers the objection
    - hook (string): 2-4 sentences that set up the problem + promise
    - mechanism (string): the unique mechanism name (use the provided Unique Mechanism if available)

Rules for strategySummary:
- objection MUST be concrete (time, trust, switching costs, complexity, "sounds like everyone else", etc)
- hook MUST include at least one concrete detail (number, timeframe, named artifact)
- mechanism MUST NOT be generic (avoid "our platform", "our solution")

Constraints:
- Tailor to Brand Voice and Offer Type if provided.
- Avoid generic outputs.
- Do not mention 'Step 1'/'Step 2' in the output.

DEPTH REQUIREMENTS (MANDATORY):
- Each idea must include at least one concrete metric, threshold, or quantified outcome.
- Each valuePromise must include a specific artifact (e.g., "scorecard", "audit report", "calculator output") and a measurable result.
- Each hook must be 2-4 sentences and include at least one number or timeframe.
- strategySummary must be strategic and specific (no vague "save time" without a number).
{_banned_words_instruction()}
{vibe_constraint}
{branding_rule}{competitor_rule}
""",
        context,
    )

    data = await client.generate_json(prompt, system_role="Contrarian Marketing Strategist")
    if isinstance(data, dict):
        data = data.get("ideas") or []
    ideas = data or []

    weakness_only = [re.sub(r"\s*\(annoys ICP because:.*\)$", "", w).strip() for w in weaknesses]

    # Ensure strategySummary exists even if model omitted it.
    for idea in ideas:
        if not isinstance(idea, dict):
            continue
        if isinstance(idea.get("strategySummary"), dict):
            continue
        fallback_mech = (product_context.unique_mechanism if product_context and product_context.unique_mechanism else "Mechanism")
        weakness_hint = weakness_only[0] if weakness_only else "Competitors make this harder than it needs to be"
        idea["strategySummary"] = {
            "objection": "This sounds like generic advice and won’t move my metric.",
            "angle": "A concrete, measurable system—built around a named mechanism.",
            "hook": f"Most teams try to fix this with generic checklists. {weakness_hint}. This lead magnet gives you a concrete diagnostic and a measurable next step.",
            "mechanism": fallback_mech,
        }

    # Repair pass if titles are generic or if whyItWorks doesn't reference competitor weaknesses.
    needs_repair = False
    for idea in ideas:
        if not isinstance(idea, dict):
            needs_repair = True
            continue
        title = str(idea.get("title") or "")
        why = str(idea.get("whyItWorks") or "")
        if not _title_has_mechanism(title):
            needs_repair = True
        if not _why_refs_any_weakness(why, weakness_only):
            needs_repair = True
    if mechanism_phrase:
        mech_count = 0
        for idea in ideas:
            if not isinstance(idea, dict):
                continue
            t = str(idea.get("title") or "")
            if mechanism_phrase.lower() in t.lower():
                mech_count += 1
        if mech_count < 2:
            needs_repair = True

    if needs_repair and isinstance(ideas, list) and ideas:
        repair_payload = json.dumps(
            {
                "competitor_weaknesses": weakness_only,
                "ideas": ideas,
                "requirements": {
                    "title_format": "Benefit + Mechanism",
                    "must_reference_competitor_weakness_in": "whyItWorks (preferred) or painPointAlignment",
                },
            },
            ensure_ascii=False,
        )
        repair_prompt = _as_json_prompt(
            """You are fixing lead magnet ideas to meet strict formatting constraints.

Update ONLY these fields as needed:
- title
- painPointAlignment
- whyItWorks

Do NOT change:
- type
- valuePromise
- conversionScore
- formatRecommendation

Rules:
- Every title must be Benefit + Mechanism (include a clear mechanism word like Audit/Scorecard/Blueprint/System/Protocol/Calculator/Template).
- Every whyItWorks must explicitly reference one competitor weakness from the provided list.
- Every strategySummary must be present with keys: objection, angle, hook, mechanism.
- If a Unique Mechanism phrase is provided, at least 2 of the 3 titles MUST contain it EXACTLY.

Return JSON with exact shape: {"ideas": [ ... ]}
""",
            repair_payload,
        )
        repaired = await client.generate_json(repair_prompt, system_role="Contrarian Marketing Strategist") or {}
        if isinstance(repaired, dict) and isinstance(repaired.get("ideas"), list):
            ideas = repaired["ideas"]

    return _clean_dict_citations(ideas or [])


async def generate_asset(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    icp: ICPProfile,
    product_context: ProductContext | None = None,
    offer_type: str | None = None, 
    brand_voice: str | None = None,
    strategy_summary: dict | None = None
) -> dict:
    context = f"Idea: {idea.title}\nType: {idea.type}\nValue: {idea.value_promise}\nICP: {icp.role} in {icp.industry}"
    if offer_type:
        context += f"\nOffer Type: {offer_type}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if product_context:
        if product_context.company_name:
            context += f"\nCompany Name: {product_context.company_name}"
        if product_context.product_description:
            context += f"\nProduct Description: {product_context.product_description}"
        if product_context.main_benefit:
            context += f"\nMain Benefit: {product_context.main_benefit}"
    if strategy_summary:
        context += (
            "\nSTRATEGY CONTEXT:\n"
            f"- Core Objection: {strategy_summary.get('objection')}\n"
            f"- Angle: {strategy_summary.get('angle')}"
        )
    
    # Add Product Context constraints
    mechanism_constraint = ""
    contrast_constraint = ""
    tone_constraint = ""
    vibe_constraint = _voice_profile_instruction(product_context)

    # Force an "aha moment" via a diagnostic question or a simple calculation.
    # Acceptance: include at least one concrete data point/calculation derived from ProductContext.
    company_name = (product_context.company_name if product_context else None) or "your company"
    product_desc = (product_context.product_description if product_context else None) or "your product"
    main_benefit = (product_context.main_benefit if product_context else None) or "your primary outcome"
    mechanism_name = (product_context.unique_mechanism if product_context else None) or "the unique mechanism"

    diagnostic_requirement = f"""

DIAGNOSTIC REQUIREMENT (MANDATORY):
- The content MUST include at least one specific 'Diagnostic Question' OR a 'Quick Calculation' that proves the reader has a problem.
- It MUST include at least one numeric threshold or metric (%, $, hours, days, error rate, conversion rate, response rate, cycle time, etc.).
- The metric/calculation MUST be grounded in ProductContext by referencing at least one of:
    - Company Name: {company_name}
    - Product Description: {product_desc}
    - Main Benefit: {main_benefit}
    - Unique Mechanism: {mechanism_name}

Examples (use as pattern, not verbatim):
- Diagnostic Question: "If your weekly {main_benefit} takes > 6 hours, you're leaking ROI."
- Quick Calculation: "Leak = (hours/week on {main_benefit}) × (blended hourly rate)."
"""

    checklist_requirement = f"""

CHECKLIST REQUIREMENTS (if type == checklist):
- The checklist must be sequential (Step 1, Step 2, ...). Each step depends on the previous.
- Each step must be outcome-based and measurable (include a numeric target/threshold where possible).
    BAD: "Check server logs"
    GOOD: "Verify error rate is <1% over the last 24 hours"
- Include at least one step that uses a Diagnostic Question or Quick Calculation (above).
"""
    
    if product_context:
        if product_context.unique_mechanism:
            mechanism_constraint = f"\n\n**CRITICAL CONSTRAINT:** You MUST mention the Unique Mechanism ('{product_context.unique_mechanism}') prominently in the content. This is the secret sauce that makes this solution work."
        if product_context.competitor_contrast:
            contrast_constraint = f"\n\n**CRITICAL CONSTRAINT:** When describing benefits, contrast them against competitors: '{product_context.competitor_contrast}'."
        if product_context.tone_guidelines:
            tone_constraint = f"\n\n**CRITICAL CONSTRAINT:** Adhere to the following tone guidelines: {', '.join(product_context.tone_guidelines)}."

    if idea.type.lower() == 'calculator':
        prompt = _as_json_prompt(
            f"""Create a functional calculator logic for this lead magnet. 
            CRITICAL: Return a strict JSON object with this EXACT structure (no extra keys):
            {{
                "type": "calculator",
                "content": "Brief markdown instructions on how to use it.",
                "content_json": {{
                    "inputs": [{{"label": "Label", "varName": "uniqueVar", "type": "number", "defaultValue": 0}}],
                    "formula": "uniqueVar * 10",
                    "resultLabel": "Result Name"
                }}
            }}
            RULES:
            0. COMPILER CHECK (MANDATORY): After drafting inputs and formula, list every identifier used in the formula and verify each one exists in inputs[].varName. If any mismatch, fix inputs and/or formula so they match exactly.
            1. 'formula' must be a math-only expression (NOT JavaScript) using ONLY: numbers, + - * / ^, parentheses, whitespace, and the defined 'varName's.
            2. 'inputs' must be an array of objects.
            3. Do NOT wrap keys in quotes inside the formula string.
            4. In the 'content' instructions, explicitly name the Unique Mechanism if provided.
            5. If STRATEGY CONTEXT is provided, the content MUST directly address the Core Objection.
            5. The calculator MUST be a believable diagnostic/proof-of-problem (not a toy). Include at least one threshold/benchmark in the instructions.
            6. COMPILER CHECK (MANDATORY): Before finalizing JSON, verify every variable used in 'formula' is defined in inputs[].varName. If not, correct the formula and/or inputs so they match EXACTLY.
            7. Formula MUST be simple arithmetic only (no Math.* calls). Allowed tokens: numbers, + - * / ^, parentheses, whitespace, and inputs varNames.

            FORMULA CONSTRAINTS:
            - DO NOT use functions like "max()", "min()", "Math.pow()".
            - ONLY use operators: +, -, *, /, ^, (, ).
            - Example: "var1 * 0.5" is valid. "max(var1, 0)" is INVALID.

            VENDOR-AGNOSTIC VALUE RULE (MANDATORY):
            - DO NOT mention logging into a product, clicking buttons, dashboards, settings, or implementation steps.
            - The calculator must be usable by someone who has NOT bought any software yet.

            DEPTH REQUIREMENTS (MANDATORY):
            - Provide 2-3 concrete usage instructions in "content" (include at least one numeric benchmark).
            - Use domain-specific variables (no generic "var1"/"var2").
            - The resultLabel must describe a concrete outcome with units (%, $, hours, days).

            {_banned_words_instruction()}
            {diagnostic_requirement}
            {mechanism_constraint}{contrast_constraint}{tone_constraint}{vibe_constraint}
            """,
            context
        )
    else:
        is_checklist = idea.type.lower() == 'checklist'
        prompt = _as_json_prompt(
            f"""Create lead magnet content based on the type using the Mechanism-Promise Framework.
            Return {{content, type, contentJson}}.
            REQUIREMENTS:
            - The first section must explicitly name the Unique Mechanism (if provided).
            - If STRATEGY CONTEXT is provided, the content MUST directly address the Core Objection.
            - When describing benefits, contrast against competitors (if provided).
            - Content should be markdown or structured text with specific, concrete claims.
            - Adopt the specified Brand Voice if provided.

            DEPTH REQUIREMENTS (MANDATORY):
            - Include at least 3 concrete, measurable claims (%, $, hours, days, counts) tied to ICP pain points.
            - Include a short "Why this works" section referencing the unique mechanism and one competitor weakness.
            - Include at least one example or mini-case specific to the ICP role/industry.

            VENDOR-AGNOSTIC VALUE RULE (MANDATORY):
            - DO NOT mention the user's software product (no product name, no dashboards, no "log in", no "click", no "settings").
            - The content must be usable by someone who has NOT bought the product yet.
            - DO NOT write a product manual. Write a diagnostic/audit/workbook that stands alone.

            {_banned_words_instruction()}
            {diagnostic_requirement}
            {checklist_requirement if is_checklist else ''}
            {mechanism_constraint}{contrast_constraint}{tone_constraint}{vibe_constraint}
            """,
            context,
        )
    result = await client.generate_json(prompt) or {}
    result = _clean_dict_citations(result)

    # Calculator safety net: ensure 100% variable matching between inputs and formula.
    if idea.type.lower() == "calculator" and isinstance(result, dict):
        content_json = result.get("content_json") or result.get("contentJson")
        if isinstance(content_json, dict):
            inputs = content_json.get("inputs")
            formula = content_json.get("formula")
            if isinstance(inputs, list) and isinstance(formula, str):
                input_vars = {str(item.get("varName") or "").strip() for item in inputs if isinstance(item, dict)}
                input_vars.discard("")
                formula_vars = _extract_formula_vars(formula)
                missing_vars = sorted(list(formula_vars - input_vars))
                extra_inputs = sorted(list(input_vars - formula_vars))
                mismatch = missing_vars or (not _is_simple_arithmetic(formula))
                if mismatch:
                    repair_payload = json.dumps({"content_json": content_json}, ensure_ascii=False)
                    repair_prompt = _as_json_prompt(
                        f"""Fix this calculator JSON so it is valid for a simple arithmetic calculator.

Rules:
- Every variable used in formula MUST exist in inputs[].varName.
- Do NOT use Math.* or functions.
- Keep the calculator as a diagnostic that proves the user has a problem.

Mismatch details:
- Variables used in formula but missing from inputs: {', '.join(missing_vars) if missing_vars else '(none)'}
- Inputs defined but not used in formula: {', '.join(extra_inputs) if extra_inputs else '(none)'}

If any variables are missing, fix by either:
- Renaming inputs[].varName to match the formula, OR
- Updating the formula to use only the defined inputs.

Return STRICT JSON with this exact shape:
{{"content_json": {{"inputs": [...], "formula": "...", "resultLabel": "..."}}}}
""",
                        repair_payload,
                    )
                    repaired = await client.generate_json(repair_prompt) or {}
                    if isinstance(repaired, dict) and isinstance(repaired.get("content_json"), dict):
                        result["content_json"] = _clean_dict_citations(repaired["content_json"])
                    elif isinstance(repaired, dict) and isinstance(repaired.get("contentJson"), dict):
                        result["content_json"] = _clean_dict_citations(repaired["contentJson"])

    # Task 1.1: Post-generation kill-list enforcement for assets.
    banned_found = _find_banned_in_obj(result)
    if banned_found:
        print(f"[KILL-LIST] Banned marketing words found in asset output: {banned_found}. Forcing rewrite.")
        # Avoid an LLM rewrite for calculators (it might accidentally mutate formula). Do a safe local rewrite.
        if idea.type.lower() == "calculator":
            result = _rewrite_banned_in_obj(result, skip_keys={"formula", "varName"})
        else:
            rewrite_prompt = _as_json_prompt(
                """Rewrite the following asset JSON to remove banned marketing words/phrases.

Hard rules:
- Preserve the EXACT JSON keys and overall structure.
- Replace banned words with concrete, specific language.
- Do not add new keys.
""" + _banned_words_instruction(),
                json.dumps(result, ensure_ascii=False),
            )
            rewritten = await client.generate_json(rewrite_prompt) or {}
            rewritten = _clean_dict_citations(rewritten)
            if isinstance(rewritten, dict) and not _find_banned_in_obj(rewritten):
                result = rewritten
            else:
                # Fallback regex rewrite
                result = _rewrite_banned_in_obj(result, skip_keys={"formula", "varName"})

    return result


async def generate_landing_page(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    asset: GeneratedAsset, 
    icp: ICPProfile,
    product_context: ProductContext | None = None,
    image_url: Optional[str] = None,
    offer_type: str | None = None, 
    brand_voice: str | None = None,
    target_conversion: str | None = None
) -> dict:
    img = image_url or "https://placehold.co/800x600/e2e8f0/1e293b?text=Hero+Image"
    
    # CRITICAL FIX: Constructing rich context
    context = f"""
    PRODUCT CONTEXT:
    - Lead Magnet Title: "{idea.title}"
    - Value Promise: "{idea.value_promise}"
    - Asset Type: {idea.type}
    - Asset Snippet: {asset.content[:300]}...
    
    TARGET AUDIENCE (The Reader):
    - Role: {icp.role}
    - Industry: {icp.industry}
    - Primary Pain Points: {', '.join(icp.pain_points)}
    - Desired Goals: {', '.join(icp.goals)}
    """
    
    if offer_type: context += f"\n- Offer Type: {offer_type}"
    if brand_voice: context += f"\n- Brand Voice: {brand_voice}"
    if target_conversion: context += f"\n- Conversion Goal: {target_conversion}"
    
    # Add Product Context for Mechanism-Promise Framework
    mechanism_constraint = ""
    contrast_constraint = ""
    tone_constraint = ""
    vibe_constraint = _voice_profile_instruction(product_context)
    
    if product_context:
        if product_context.company_name:
            context += f"\n- Company Name: {product_context.company_name}"
        if product_context.product_description:
            context += f"\n- Product Description: {product_context.product_description}"
        if product_context.main_benefit:
            context += f"\n- Main Benefit: {product_context.main_benefit}"
        if product_context.unique_mechanism:
            context += f"\n- Unique Mechanism: {product_context.unique_mechanism}"
            mechanism_constraint = f"\n\n**CRITICAL CONSTRAINT:** You MUST mention the Unique Mechanism ('{product_context.unique_mechanism}') in the subheadline or bullets. This is the core differentiator."
        if product_context.competitor_contrast:
            context += f"\n- Competitor Contrast: {product_context.competitor_contrast}"
            contrast_constraint = f"\n\n**CRITICAL CONSTRAINT:** When describing benefits, contrast them against competitors: '{product_context.competitor_contrast}'."
        if product_context.tone_guidelines:
            context += f"\n- Tone Guidelines: {', '.join(product_context.tone_guidelines)}"
            tone_constraint = f"\n\n**CRITICAL CONSTRAINT:** Adhere to the following tone guidelines: {', '.join(product_context.tone_guidelines)}."

    # DESIGN MATCHING: bridge scraped vibe/industry to renderer backgroundStyle
    design_instruction = ""
    if product_context and product_context.design_vibe:
        vibe = (product_context.design_vibe or "").lower()
        design_instruction = f"""
        DESIGN MATCHING:
        The client's existing website has a "{vibe}" design vibe.
        Choose backgroundStyle using these rules:
        - If vibe contains 'tech' or 'bold' -> backgroundStyle = 'tech_grid'
        - If vibe contains 'minimal' or 'corporate' -> backgroundStyle = 'clean_dots'
        - If vibe contains 'creative', 'modern', or 'soft' -> backgroundStyle = 'soft_aurora'
        - Otherwise -> backgroundStyle = 'plain_white'
        """
    else:
        design_instruction = f"""
        DESIGN MATCHING:
        No website vibe was provided. Infer backgroundStyle from industry "{icp.industry}":
        - SaaS/Tech/Developer tools -> 'tech_grid'
        - Finance/Legal/Compliance/Enterprise -> 'clean_dots'
        - Creative/Health/Lifestyle/Education -> 'soft_aurora'
        - Otherwise -> 'plain_white'
        """

    strategy = await _generate_lp_strategy(client, context)
    strategy_json = json.dumps(strategy or {}, ensure_ascii=False)

    render_prompt = _as_json_prompt(
        f"""
                ACT AS: A Senior Product Designer & Direct-Response Copywriter.

          PRIMARY DIRECTIVE:
          Use the Strategy Brief provided below.
          - The output JSON "headline" MUST match strategy.antiObjectionHeadline (same words; minor punctuation ok).
          - Build the rest of the page around strategy.angle, strategy.hook, and strategy.objectionHandling.

          STRATEGY BRIEF (JSON):
          {strategy_json}

          STYLE CONSTRAINTS:
          {vibe_constraint}

          DESIGN MATCHING:
          {design_instruction}

          PRODUCT/BRAND CONSTRAINTS:
          {mechanism_constraint}{contrast_constraint}{tone_constraint}

          COPYWRITING "KILL LIST" (BANNED PHRASES):
          - NO "Revolutionize"
          - NO "Empower"
          - NO "Unlock potential"
          - NO "Key Features" (Use benefit-driven headers like "Built for speed")
          - NO "Why Choose Us" (Use "The competitive edge" or specific outcomes)
          - NO "Introduction"

          {_banned_words_instruction()}

          SECTION TITLE RULES:
          - No generic titles: "Introduction", "Features", "Key Features", "Benefits", "Overview", "How It Works", "Why Choose Us".
          - Titles must be benefit/outcome-driven and specific.

          DEPTH REQUIREMENTS (MANDATORY):
          - Each section must include at least 2 items with concrete metrics or quantified outcomes.
          - Subheadline must include a specific outcome or timeframe.
          - Hero must include a clear mechanism reference and a quantified promise.

          VISUAL COMPONENT RULES (JSON STRUCTURE):
          1. Hero Section:
              - Headline: Bold, high contrast.
              - Background: Choose backgroundStyle using DESIGN MATCHING.

          2. The Problem/Solution (variant: split_feature):
              - Left: Strong headline about the pain point.
              - Right: Visual placeholder.

          3. The Mechanism (variant: bento_grid):
              - Layout: Grid of cards describing exactly HOW it works.
              - Icons: Use specific tech-oriented icon names (cpu, terminal, git-branch, zap, shield).

          4. Social Proof (variant: feature_cards):
              - Instead of generic reviews, show specific metrics achieved.

          OUTPUT RULES:
          - Return STRICT JSON only.
          - Do NOT return a long HTML blob. Keep htmlContent as an empty string ("") unless absolutely necessary.
          - Do NOT put HTML in section.body. Use section.items[].
          - backgroundStyle MUST be one of: tech_grid, clean_dots, soft_aurora, plain_white.
          - theme MUST be "light" or "dark".

          REQUIRED SECTION SCHEMA:
          Each section must be an object with:
          - id: string
          - variant: "hero" | "split_feature" | "bento_grid" | "feature_cards"
          - title: string
          - subtitle: string
          - items: array of objects {{ "title": string, "description": string, "icon": string }}

          INPUT CONTEXT:
          {context}

          REQUIRED OUTPUT JSON FORMAT EXAMPLE:
          {{
              "headline": "Stop manually updating Jira tickets.",
              "subheadline": "The auto-sync template that saves 12 hours/week per developer. No plugins required.",
              "cta": "Get the Template",
              "theme": "dark",
              "backgroundStyle": "tech_grid",
              "htmlContent": "",
              "sections": [
                  {{
                      "id": "problem",
                      "variant": "split_feature",
                      "title": "Your developers want to code, not do admin.",
                      "subtitle": "Manual updates kill flow state. This template automates status sync directly from Git.",
                      "items": [
                          {{ "title": "Git-to-Sheet Sync", "description": "Commits update rows automatically.", "icon": "git-commit" }}
                      ]
                  }},
                  {{
                      "id": "mechanism",
                      "variant": "bento_grid",
                      "title": "Engineered for velocity",
                      "subtitle": "Everything you need to ship faster.",
                      "items": [
                          {{ "title": "50ms Latency", "description": "Updates reflect instantly across the board.", "icon": "zap" }},
                          {{ "title": "Zero Context Switching", "description": "Update status without leaving the terminal.", "icon": "terminal" }}
                      ]
                  }},
                  {{
                      "id": "edge",
                      "variant": "feature_cards",
                      "title": "The competitive edge",
                      "subtitle": "Concrete outcomes teams report in week one.",
                      "items": [
                          {{ "title": "12 hours/week saved", "description": "Per developer, from automatic status sync.", "icon": "chart" }},
                          {{ "title": "Fewer missed handoffs", "description": "One source of truth replaces 4 tools.", "icon": "shield" }},
                          {{ "title": "Faster cycle time", "description": "PR-to-done shrinks by 18%.", "icon": "zap" }}
                      ]
                  }}
              ]
          }}
          """,
          context,
     )

    result = await client.generate_json(render_prompt) or {}
    
    # Clean citations from result
    result = _clean_dict_citations(result)
    # Surface strategy for downstream persistence (Project.strategy_summary, nurture, social)
    if strategy:
        result["strategySummary"] = strategy

    # Task 1.1: Post-generation kill-list enforcement for landing pages.
    banned_found = _find_banned_in_obj(result)
    if banned_found:
        print(f"[KILL-LIST] Banned marketing words found in landing page JSON: {banned_found}. Forcing rewrite.")
        rewrite_prompt = _as_json_prompt(
            """Rewrite the following landing page JSON to remove banned marketing words/phrases.

Hard rules:
- Preserve the EXACT JSON keys and overall structure.
- Replace banned words with concrete, specific language.
- Do not add new keys.
""" + _banned_words_instruction(),
            json.dumps(result, ensure_ascii=False),
        )
        rewritten = await client.generate_json(rewrite_prompt) or {}
        rewritten = _clean_dict_citations(rewritten)
        if isinstance(rewritten, dict) and rewritten:
            # If rewrite is still bad, do a regex-based fallback rewrite.
            if _find_banned_in_obj(rewritten):
                result = _rewrite_banned_in_obj(rewritten)
            else:
                result = rewritten
        else:
            result = _rewrite_banned_in_obj(result)

    # Ensure headline follows the strategist's anti-objection strategy.
    if isinstance(strategy, dict):
        anti = (strategy.get("antiObjectionHeadline") or strategy.get("headline") or "").strip()
        if anti:
            result["headline"] = anti

    # Ensure no generic section titles slip through.
    banned_title_terms = (
        "introduction",
        "features",
        "key features",
        "benefits",
        "overview",
        "how it works",
        "why choose us",
        "why us",
    )
    fallback_titles_by_variant = {
        "hero": "The fastest path to the result",
        "split_feature": "The real problem (and the fix)",
        "bento_grid": "The mechanism, step by step",
        "feature_cards": "Results teams report",
        "generic": "The competitive edge",
    }
    sections = result.get("sections")
    if isinstance(sections, list):
        for section in sections:
            if not isinstance(section, dict):
                continue
            title = (section.get("title") or "").strip()
            low = title.lower()
            if not title or any(term in low for term in banned_title_terms):
                variant = (section.get("variant") or "generic")
                section["title"] = fallback_titles_by_variant.get(variant, "The competitive edge")

    # Ensure backgroundStyle is valid and always present.
    # Also: avoid "plain_white" by default to prevent "plain design" complaints.
    allowed_styles = {"tech_grid", "clean_dots", "soft_aurora", "plain_white"}
    style = result.get("backgroundStyle")

    if not style or style not in allowed_styles or style == "plain_white":
        # Prefer scraped vibe if available, else infer from industry.
        chosen = "clean_dots"  # sensible default for B2B/corporate
        if product_context and product_context.design_vibe:
            vibe = (product_context.design_vibe or "").lower()
            if "tech" in vibe or "bold" in vibe:
                chosen = "tech_grid"
            elif "minimal" in vibe or "corporate" in vibe:
                chosen = "clean_dots"
            elif "creative" in vibe or "modern" in vibe or "soft" in vibe:
                chosen = "soft_aurora"
        else:
            ind = (icp.industry or "").lower()
            if any(k in ind for k in ["saas", "tech", "developer", "software"]):
                chosen = "tech_grid"
            else:
                chosen = "clean_dots"

        result["backgroundStyle"] = chosen

    # Ensure theme is valid and always present.
    allowed_themes = {"light", "dark"}
    theme = result.get("theme")
    if not theme or theme not in allowed_themes:
        ind = (icp.industry or "").lower()
        if any(k in ind for k in ["saas", "tech", "developer", "software"]):
            result["theme"] = "dark"
        else:
            result["theme"] = "light"

    # Ensure sections are structured (items array) and variants are valid.
    allowed_variants = {
        "hero",
        "split_feature",
        "bento_grid",
        "feature_cards",
        "feature",
        "testimonial",
        "faq",
        "generic",
        "introduction",
    }
    sections = result.get("sections")
    if not isinstance(sections, list):
        sections = []
    cleaned_sections: list[dict] = []
    for idx, section in enumerate(sections):
        if not isinstance(section, dict):
            continue
        variant = (section.get("variant") or "generic")
        if variant not in allowed_variants:
            variant = "generic"

        items = section.get("items")
        if not isinstance(items, list):
            items = []
        normalized_items: list[dict] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or "").strip()
            desc = str(item.get("description") or "").strip()
            if not title and not desc:
                continue
            normalized_items.append(
                {
                    "title": title or "Key point",
                    "description": desc or "",
                    "icon": item.get("icon") or "check",
                }
            )

        # Back-compat conversion: if no items, try to convert subtitle/body into one item.
        if not normalized_items:
            fallback_desc = str(section.get("subtitle") or section.get("body") or "").strip()
            if fallback_desc:
                normalized_items = [{"title": "Key point", "description": fallback_desc, "icon": "check"}]

        cleaned_sections.append(
            {
                "id": str(section.get("id") or f"section_{idx}"),
                "variant": variant,
                "title": str(section.get("title") or "").strip() or "Section",
                "subtitle": str(section.get("subtitle") or "").strip(),
                "items": normalized_items,
                # Keep body only for legacy renderers; designer prompt forbids HTML in body.
                "body": section.get("body"),
            }
        )
    result["sections"] = cleaned_sections
    
    # CRITIC LOOP: Review the generated copy for genericness
    if result and product_context and product_context.unique_mechanism:
        # Review the headline and subheadline
        combined_copy = f"Headline: {result.get('headline', '')}\nSubheadline: {result.get('subheadline', '')}"
        
        review = await review_copy(
            client,
            combined_copy,
            unique_mechanism=product_context.unique_mechanism,
            context=f"Target Audience: {icp.role}\nLead Magnet: {idea.title}"
        )
        
        # If the copy is generic, use the improved version
        if review.get("is_generic"):
            print(f"[CRITIC] Copy was generic. Feedback: {review.get('feedback')}")
            improved = review.get("improved_version", "")
            
            # Parse the improved version back into headline and subheadline
            if "Headline:" in improved and "Subheadline:" in improved:
                parts = improved.split("Subheadline:")
                headline_part = parts[0].replace("Headline:", "").strip()
                subheadline_part = parts[1].strip() if len(parts) > 1 else result.get('subheadline', '')
                
                result['headline'] = headline_part
                result['subheadline'] = subheadline_part
            else:
                # If format doesn't match, just improve the headline
                result['headline'] = improved
    
    return result


async def generate_thank_you_page(client: LLMClient, idea: LeadMagnetIdea) -> dict:
    prompt = _as_json_prompt(
        "Write a concise thank you page. Return {headline, body, cta, htmlContent}.",
        f"Lead magnet: {idea.title}\nValue: {idea.value_promise}",
    )
    result = await client.generate_json(prompt) or {}
    return _clean_dict_citations(result)


async def chat_marketing_assistant(client: LLMClient, message: str, project_context: Any | None) -> str:
    system_prompt = (
        "You are an Expert Direct-Response Marketing Consultant. "
        "Use the provided project context to answer with concrete, strategic recommendations. "
        "If context is missing, ask 1-2 clarifying questions before giving generic advice. "
        "Be specific, concise, and actionable."
    )

    context_lines: list[str] = []
    if project_context:
        icp = getattr(project_context, "icp", None)
        product = getattr(project_context, "product_context", None) or getattr(project_context, "productContext", None)
        idea = getattr(project_context, "selected_idea", None) or getattr(project_context, "selectedIdea", None)
        strategy = getattr(project_context, "strategy_summary", None) or getattr(project_context, "strategySummary", None)

        if icp:
            context_lines.append(f"ICP Role: {getattr(icp, 'role', '')}")
            context_lines.append(f"ICP Industry: {getattr(icp, 'industry', '')}")
            pain_points = getattr(icp, "pain_points", None) or getattr(icp, "painPoints", None) or []
            goals = getattr(icp, "goals", None) or []
            if pain_points:
                context_lines.append(f"ICP Pain Points: {', '.join(pain_points)}")
            if goals:
                context_lines.append(f"ICP Goals: {', '.join(goals)}")

        if product:
            context_lines.append(f"Company Name: {getattr(product, 'company_name', '') or getattr(product, 'companyName', '')}")
            context_lines.append(f"Unique Mechanism: {getattr(product, 'unique_mechanism', '') or getattr(product, 'uniqueMechanism', '')}")
            context_lines.append(f"Main Benefit: {getattr(product, 'main_benefit', '') or getattr(product, 'mainBenefit', '')}")
            context_lines.append(f"Competitor Contrast: {getattr(product, 'competitor_contrast', '') or getattr(product, 'competitorContrast', '')}")

        if idea:
            context_lines.append(f"Lead Magnet Title: {getattr(idea, 'title', '')}")
            context_lines.append(f"Lead Magnet Type: {getattr(idea, 'type', '')}")
            context_lines.append(f"Value Promise: {getattr(idea, 'value_promise', '') or getattr(idea, 'valuePromise', '')}")

        if strategy and isinstance(strategy, dict):
            context_lines.append(f"Primary Objection: {strategy.get('objection')}")
            context_lines.append(f"Angle: {strategy.get('angle')}")

        offer_type = getattr(project_context, "offer_type", None) or getattr(project_context, "offerType", None)
        brand_voice = getattr(project_context, "brand_voice", None) or getattr(project_context, "brandVoice", None)
        if offer_type:
            context_lines.append(f"Offer Type: {offer_type}")
        if brand_voice:
            context_lines.append(f"Brand Voice: {brand_voice}")

    context_block = "\n".join([line for line in context_lines if line]) or "No project context available."

    prompt = f"""SYSTEM: {system_prompt}

PROJECT CONTEXT:
{context_block}

USER QUESTION:
{message}

RESPONSE GUIDELINES:
- Provide 3-7 bullets or numbered steps.
- Include at least one concrete example or line of copy when relevant.
- Tie recommendations back to the ICP pain points and the unique mechanism.
"""

    preferred_model = None
    if (client.settings.llm_model or "").startswith("gpt-4o"):
        preferred_model = "gpt-4o"

    return await client.generate_text(prompt, model_override=preferred_model)


async def generate_nurture_sequence(
    client: LLMClient, 
    idea: LeadMagnetIdea,
    asset: GeneratedAsset | None = None,
    product_context: ProductContext | None = None,
    strategy_summary: dict | None = None,
    brand_voice: str | None = None,
    target_conversion: str | None = None
) -> list[dict]:
    context = f"Lead magnet: {idea.title}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if target_conversion:
        context += f"\nTarget Goal: {target_conversion}"
    if product_context and product_context.company_name:
        context += f"\nCompany Name: {product_context.company_name}"

    asset_summary = ""
    if asset:
        if asset.content_json:
            asset_summary = json.dumps(asset.content_json, ensure_ascii=False)
        elif asset.content:
            asset_summary = asset.content[:800]
    if asset_summary:
        context += f"\nLead Magnet Content Summary: {asset_summary}"

    vibe_constraint = _voice_profile_instruction(product_context)
    strategy = strategy_summary
    if not strategy and isinstance(getattr(idea, "strategy_summary", None), dict):
        strategy = idea.strategy_summary
    strategy_json = json.dumps(strategy or {}, ensure_ascii=False)

    prompt = _as_json_prompt(
        f"""Write a 3-5 email nurture sequence.
        Return STRICT JSON with this exact shape: {{ "emails": [ ... ] }}.
        Each item in emails must be an object with {{subject, body, delay, intent}}. Infuse the Brand Voice.

STYLE CONSTRAINTS (if provided):
{vibe_constraint}

STRATEGY SUMMARY (use as primary argumentation; do NOT ignore):
{strategy_json}

RULE: If strategy summary includes an objection, address it explicitly in Email 1 and Email 2.

Do NOT use placeholders like '[Your Company]' or '[My Name]'.
- Use the provided company name ({product_context.company_name if product_context else ''}) for the signature.
- Use 'there' or leave the name blank if not provided, do not put brackets.
CRITICAL: Every single email must mention the Unique Mechanism ('{product_context.unique_mechanism if product_context else ''}') at least once. Never imply the solution is generic.

CONTENT ANCHORING RULES:
- Use the Lead Magnet Content Summary to reference a specific "Aha moment" from the asset.
- Email 1 must explicitly reference the "Aha moment" from the Lead Magnet.
- Email 2 must highlight the gap between the free value (Lead Magnet) and the paid solution (Upgrade Offer).

PER-EMAIL REQUIREMENT (apply to each email individually):
- Include the Unique Mechanism by name: "{product_context.unique_mechanism if product_context else ''}".

DEPTH REQUIREMENTS (MANDATORY):
- Each email body must be at least 120-180 words.
- Each email must include 1 concrete example or scenario relevant to the ICP.
- Across the sequence, include at least 2 quantified outcomes (%, $, hours, days).
{vibe_constraint}
""",
        context,
    )
    import uuid
    data = await client.generate_json(prompt)
    if isinstance(data, dict):
        data = data.get("emails") or []
    if not data:
        return []
    if not isinstance(data, list):
        data = [data]
    
    # Clean citations from all email bodies
    data = _clean_dict_citations(data)
    
    # Enrich with IDs
    for item in data:
        if isinstance(item, dict) and "id" not in item:
            item["id"] = str(uuid.uuid4())
            
    return data or []


async def generate_upgrade_offer(
    client: LLMClient,
    idea: LeadMagnetIdea,
    emails: list[dict],
    product_context: ProductContext | None = None,
    offer_type: str | None = None,
    brand_voice: str | None = None,
    target_conversion: str | None = None
) -> dict:
    context = f"Lead magnet: {idea.title}\nEmails: {len(emails)}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if target_conversion:
        context += f"\nTarget Goal: {target_conversion}"
    if product_context:
        if product_context.company_name:
            context += f"\nCompany Name: {product_context.company_name}"
        if product_context.product_description:
            context += f"\nProduct Description: {product_context.product_description}"
        if product_context.main_benefit:
            context += f"\nMain Benefit: {product_context.main_benefit}"
        if product_context.unique_mechanism:
            context += f"\nUnique Mechanism: {product_context.unique_mechanism}"
        if product_context.competitor_contrast:
            context += f"\nCompetitor Contrast: {product_context.competitor_contrast}"
        if product_context.tone_guidelines:
            context += f"\nTone Guidelines: {', '.join(product_context.tone_guidelines)}"

    if offer_type:
        context += f"\nOffer Type: {offer_type}"

    vibe_constraint = _voice_profile_instruction(product_context)

    saas_constraint = ""
    if offer_type and offer_type.lower() == "saas":
        saas_constraint = (
            "\n- IF offer_type is SaaS: the upgrade must be a Trial or Demo offer only. "
            "Pricing MUST be $0 and should never imply a paid ebook or one-time purchase. "
            "Use language like 'Start your free trial' or 'Book a demo'."
        )

    prompt = _as_json_prompt(
                """Create an Irresistible Offer Stack. Include a Risk Reversal (Guarantee) and 2 bonuses that handle objections.
Return STRICT JSON with these exact camelCase fields:
{
  "coreOffer": "string",
  "price": "$97",
  "valueAnchor": "$500",
  "guarantee": "string",
  "bonuses": ["Bonus 1", "Bonus 2"]
}
    Rules:
- Price and valueAnchor must be human-readable strings (include currency if relevant).
- Bonuses must be specific and tied to the lead magnet topic.
 - If the price is $0 (Free), the Guarantee MUST be a non-monetary Satisfaction or Wasted-Time guarantee (e.g., "If it's not useful, we'll donate $50 to charity"). Do NOT offer refunds for free products.
    {saas_constraint}
    - Use the Mechanism-Promise Framework if available.
    - If tone guidelines are provided, follow them strictly.
    - If a voice profile is provided, follow it strictly.
    {vibe_constraint}
""",
        context,
    )
    result = await client.generate_json(prompt) or {}
    return _clean_dict_citations(result)


async def generate_linkedin_post(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    landing_page: Any,
    brand_voice: str | None = None,
    product_context: ProductContext | None = None,
    strategy_summary: dict | None = None
) -> str:
    headline = getattr(landing_page, "headline", None) or ""
    bullets = getattr(landing_page, "bullets", None) or []
    vibe_constraint = _voice_profile_instruction(product_context)
    strategy = strategy_summary
    if not strategy and isinstance(getattr(idea, "strategy_summary", None), dict):
        strategy = idea.strategy_summary
    strategy_json = json.dumps(strategy or {}, ensure_ascii=False)
    prompt = _as_json_prompt(
        f"""Write a LinkedIn post to promote the lead magnet "{idea.title}".
Headline: {headline}
Key benefits: {', '.join(bullets)}
STRATEGY SUMMARY (primary argumentation; MUST reference objection if present):
{strategy_json}

Hard requirement:
- If strategy summary contains an "objection", the post MUST explicitly reference it in the first 2 lines (paraphrase ok).
STYLE CONSTRAINTS (if provided):
{vibe_constraint}

DEPTH REQUIREMENTS (MANDATORY):
- 6-10 short paragraphs (1-2 sentences each).
- Include at least one specific metric or timeframe.
- Include one concrete example or mini-case.
""",
        """Rules: Educational first, hook in the first line, CTA at end to check the link. No hashtag spam.
Return STRICT JSON with this exact shape: {"text": "..."}.
Do not include meta-commentary like "Here is your post".
"""
    )
    if brand_voice:
        prompt += f"\nBrand Voice: {brand_voice}\n"

    result = await client.generate_json(prompt) or {}
    if isinstance(result, dict):
        text = result.get("text") or ""
    else:
        text = str(result)
    return _clean_citations(text)


async def generate_hero_image(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    icp: ICPProfile,
    brand_voice: str | None = None,
    offer_type: str | None = None
) -> str:
    """
    Generates a search query for Unsplash instead of generating a base64 image.
    """
    context = f"Lead Magnet: {idea.title}\nAudience: {icp.role}\nIndustry: {icp.industry}"
    
    prompt = _as_json_prompt(
        f"""
        We need a high-quality stock photo for a landing page hero section.
        CONTEXT: {context}
        
        TASK: Return a JSON object with a single field 'query'.
        The query should be 2-4 words describing a physical scene or object.
        - Good: "modern office meeting", "data dashboard screen", "industrial factory floor"
        - Bad: "success", "growth", "happiness" (too abstract)
        
        JSON Shape: {{ "query": "string" }}
        """,
        context
    )
    
    try:
        result = await client.generate_json(prompt)
        query = result.get("query", "business technology") if isinstance(result, dict) else "business technology"
    except Exception:
        query = f"{icp.industry} office"

    return await search_stock_image(query)


async def generate_persona_summary(client: LLMClient, icp: ICPProfile) -> dict:
    prompt = _as_json_prompt(
        """Analyze the defined Audience/ICP and return a summary and hook examples.
        Return JSON with:
        - summary (string): A 1-2 sentence "identity" summary of this persona (e.g. "Overwhelmed SaaS marketers looking for quick wins...").
        - hooks (string[]): 2-3 short, punchy opening hooks/headlines that would resonate with their pain points.
        """,
        f"Role: {icp.role}\nIndustry: {icp.industry}\nPain Points: {', '.join(icp.pain_points)}\nGoals: {', '.join(icp.goals)}"
    )
    result = await client.generate_json(prompt) or {"summary": "", "hooks": []}
    return _clean_dict_citations(result)
