from __future__ import annotations
import json
from typing import Any, Optional
import httpx
from app.models.schemas import ICPProfile, LeadMagnetIdea, GeneratedAsset, LandingPageConfig, Email
from app.models.schemas import Settings as SettingsSchema


def _extract_json(text: str) -> Any:
    if not text:
        return None
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


class LLMClient:
    def __init__(self, settings: SettingsSchema):
        self.settings = settings

    async def generate_json(self, prompt: str) -> Any:
        provider = (self.settings.llm_provider or "").lower()
        if provider == "perplexity":
            return await self._perplexity_json(prompt)
        if provider == "openai":
            return await self._openai_json(prompt)
        return await self._gemini_json(prompt)

    async def generate_text(self, prompt: str) -> str:
        provider = (self.settings.llm_provider or "").lower()
        if provider == "perplexity":
            return await self._perplexity_text(prompt)
        if provider == "openai":
            return await self._openai_text(prompt)
        return await self._gemini_text(prompt)

    async def _perplexity_request(self, prompt: str, response_format: str | None = None) -> dict:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")

        model = self.settings.llm_model or "sonar-pro"
        if model == "gbt-5.2":
            model = "sonar-pro"
        temperature = self.settings.llm_temperature or 0.4
        max_tokens = self.settings.llm_max_tokens or 2048

        headers = {
            "Authorization": f"Bearer {self.settings.llm_api_key}",
            "Content-Type": "application/json",
        }

        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload)
            if response.status_code != 200:
                print(f"PERPLEXITY ERROR: {response.status_code} - {response.text}")
            response.raise_for_status()
            return response.json()

    async def _perplexity_json(self, prompt: str) -> Any:
        data = await self._perplexity_request(prompt, response_format="json")
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return _extract_json(content)

    async def _perplexity_text(self, prompt: str) -> str:
        data = await self._perplexity_request(prompt)
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def _gemini_json(self, prompt: str) -> Any:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")
        model = self.settings.llm_model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": self.settings.llm_temperature or 0.4,
                "maxOutputTokens": self.settings.llm_max_tokens or 2048,
                "responseMimeType": "application/json",
            },
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, params={"key": self.settings.llm_api_key}, json=payload)
            response.raise_for_status()
            data = response.json()
        text = ""
        for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
            if "text" in part:
                text += part["text"]
        return _extract_json(text)

    async def _gemini_text(self, prompt: str) -> str:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")
        model = self.settings.llm_model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": self.settings.llm_temperature or 0.4,
                "maxOutputTokens": self.settings.llm_max_tokens or 2048,
            },
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, params={"key": self.settings.llm_api_key}, json=payload)
            response.raise_for_status()
            data = response.json()
        text = ""
        for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
            if "text" in part:
                text += part["text"]
        return text

    async def _openai_json(self, prompt: str) -> Any:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")
        model = self.settings.llm_model or "gpt-4o-mini"
        payload = {
            "model": model,
            "temperature": self.settings.llm_temperature or 0.4,
            "max_tokens": self.settings.llm_max_tokens or 2048,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return _extract_json(text)

    async def _openai_text(self, prompt: str) -> str:
        if not self.settings.llm_api_key:
            raise RuntimeError("Missing LLM API key")
        model = self.settings.llm_model or "gpt-4o-mini"
        payload = {
            "model": model,
            "temperature": self.settings.llm_temperature or 0.4,
            "max_tokens": self.settings.llm_max_tokens or 2048,
            "messages": [
                {"role": "user", "content": prompt},
            ],
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


def _as_json_prompt(instructions: str, payload: str) -> str:
    return f"""{instructions}

Return strictly valid JSON and nothing else.

Context:
{payload}
"""


async def ideate_lead_magnets(
    client: LLMClient, 
    icp: ICPProfile, 
    offer_type: str | None = None, 
    brand_voice: str | None = None, 
    target_conversion: str | None = None
) -> list[dict]:
    context = f"ICP role: {icp.role}\nIndustry: {icp.industry}\nCompany size: {icp.company_size}\nPain points: {', '.join(icp.pain_points)}\nGoals: {', '.join(icp.goals)}"
    if offer_type:
        context += f"\nOffer Type: {offer_type}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if target_conversion:
        context += f"\nTarget Goal: {target_conversion}"

    prompt = _as_json_prompt(
        """Generate 3 high-conversion lead magnet ideas. Return an array of objects with these EXACT field names (camelCase):
        - title (string): Catchy title for the lead magnet
        - type (string): One of: checklist, template, calculator, report, other
        - painPointAlignment (string): Which pain point this addresses
        - valuePromise (string): Clear value proposition
        - conversionScore (number): 1-10 estimated conversion rate
        - formatRecommendation (string): Suggested delivery format
        
        Tailor the ideas to the Brand Voice and Offer Type if provided.""",
        context,
    )
    data = await client.generate_json(prompt)
    if isinstance(data, dict):
        data = data.get("ideas") or data.get("items") or []
    return data or []


async def generate_asset(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    icp: ICPProfile,
    offer_type: str | None = None, 
    brand_voice: str | None = None
) -> dict:
    context = f"Idea: {idea.title}\nType: {idea.type}\nValue: {idea.value_promise}\nICP: {icp.role} in {icp.industry}"
    if offer_type:
        context += f"\nOffer Type: {offer_type}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"

    prompt = _as_json_prompt(
        "Create lead magnet content based on the type. Return {content, type, contentJson}. Content should be markdown or structured text. Adopt the specified Brand Voice if provided.",
        context,
    )
    return await client.generate_json(prompt) or {}


async def generate_landing_page(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    asset: GeneratedAsset, 
    image_url: Optional[str],
    offer_type: str | None = None, 
    brand_voice: str | None = None,
    target_conversion: str | None = None
) -> dict:
    img = image_url or "https://placehold.co/800x600/e2e8f0/1e293b?text=Hero+Image"
    context = f"Lead magnet: {idea.title}\nAsset excerpt: {asset.content[:400]}\nImage URL: {img}"
    if offer_type:
        context += f"\nOffer Type: {offer_type}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if target_conversion:
        context += f"\nTarget Goal: {target_conversion}"

    prompt = _as_json_prompt(
        """Write a high-converting landing page. Return strictly valid JSON with this structure:
        {
          "headline": "Main value prop",
          "subheadline": "Supporting copy",
          "bullets": ["benefit 1", "benefit 2"],
          "cta": "Call to action text",
          "htmlContent": "<main>... inner HTML using Tailwind ...</main>",
          "sections": [
            { "id": "features", "title": "What you get", "body": "...", "variant": "feature" },
            { "id": "faq", "title": "FAQ", "body": "...", "variant": "faq" }
          ],
          "formSchema": [
            { "name": "name", "label": "Full Name", "type": "text", "required": true },
            { "name": "email", "label": "Work Email", "type": "email", "required": true }
          ],
          "socialProof": [{ "quote": "...", "author": "..." }],
          "faq": [{ "question": "...", "answer": "..." }]
        }
        Use Tailwind CDN classes in htmlContent. The htmlContent should be a complete valid inner <main> tag.
        Match the Brand Voice.""",
        context,
    )
    return await client.generate_json(prompt) or {}


async def generate_thank_you_page(client: LLMClient, idea: LeadMagnetIdea) -> dict:
    prompt = _as_json_prompt(
        "Write a concise thank you page. Return {headline, body, cta, htmlContent}.",
        f"Lead magnet: {idea.title}\nValue: {idea.value_promise}",
    )
    return await client.generate_json(prompt) or {}


async def generate_nurture_sequence(
    client: LLMClient, 
    idea: LeadMagnetIdea,
    brand_voice: str | None = None,
    target_conversion: str | None = None
) -> list[dict]:
    context = f"Lead magnet: {idea.title}"
    if brand_voice:
        context += f"\nBrand Voice: {brand_voice}"
    if target_conversion:
        context += f"\nTarget Goal: {target_conversion}"

    prompt = _as_json_prompt(
        "Write a 3-5 email nurture sequence. Return an array of {subject, body, delay, intent}. Infuse the Brand Voice.",
        context,
    )
    import uuid
    data = await client.generate_json(prompt)
    if isinstance(data, dict):
        data = data.get("emails") or data.get("items") or []
    
    # Enrich with IDs
    for item in data:
        if isinstance(item, dict) and "id" not in item:
            item["id"] = str(uuid.uuid4())
            
    return data or []


async def generate_upgrade_offer(client: LLMClient, idea: LeadMagnetIdea, emails: list[Email]) -> dict:
    prompt = _as_json_prompt(
        "Suggest an upgrade offer and write copy. Return {positioning, offerCopy, cta}.",
        f"Lead magnet: {idea.title}\nEmails: {len(emails)}",
    )
    return await client.generate_json(prompt) or {}


async def generate_linkedin_post(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    landing_page: LandingPageConfig,
    brand_voice: str | None = None
) -> str:
    prompt = f"""Write a LinkedIn post to promote the lead magnet "{idea.title}".
Headline: {landing_page.headline}
Key benefits: {', '.join(landing_page.bullets)}
"""
    if brand_voice:
        prompt += f"Brand Voice: {brand_voice}\n"

    prompt += "Rules: Educational first, hook in the first line, CTA at end to check the link. No hashtag spam.\n"
    return await client.generate_text(prompt)


async def generate_hero_image(
    client: LLMClient, 
    idea: LeadMagnetIdea, 
    icp: ICPProfile,
    brand_voice: str | None = None,
    offer_type: str | None = None
) -> str:
    if (client.settings.llm_provider or "").lower() != "gemini":
        return ""
    if not client.settings.llm_api_key:
        raise RuntimeError("Missing LLM API key")
    model = client.settings.llm_model or "gemini-2.0-flash-exp" # Upgrade to 2.0 Flash for better images if available, else fallback
    
    style_context = "Professional, clean, corporate, trustworthy"
    if brand_voice:
        style_context = f"{brand_voice} style"
    
    prompt = (
        "Generate a modern, high-quality, flat-style illustration or photo for a landing page hero section. "
        f"Subject: {idea.title}. Context: {idea.value_promise}. Audience: {icp.role} in {icp.industry}. "
        f"Style: {style_context}. Do not include text in the image."
    )
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
    }
    async with httpx.AsyncClient(timeout=120) as client_http:
        response = await client_http.post(url, params={"key": client.settings.llm_api_key}, json=payload)
        response.raise_for_status()
        data = response.json()
    for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        inline = part.get("inlineData")
        if inline and inline.get("data"):
            return f"data:image/png;base64,{inline['data']}"
    return ""


async def generate_persona_summary(client: LLMClient, icp: ICPProfile) -> dict:
    prompt = _as_json_prompt(
        """Analyze the defined Audience/ICP and return a summary and hook examples.
        Return JSON with:
        - summary (string): A 1-2 sentence "identity" summary of this persona (e.g. "Overwhelmed SaaS marketers looking for quick wins...").
        - hooks (string[]): 2-3 short, punchy opening hooks/headlines that would resonate with their pain points.
        """,
        f"Role: {icp.role}\nIndustry: {icp.industry}\nPain Points: {', '.join(icp.pain_points)}\nGoals: {', '.join(icp.goals)}"
    )
    return await client.generate_json(prompt) or {"summary": "", "hooks": []}
