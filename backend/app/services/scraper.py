from __future__ import annotations

from typing import Any
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import httpx

from app.services.llm_service import LLMClient, _as_json_prompt


async def extract_brand_context(url: str, client: LLMClient) -> dict[str, Any]:
    if not url:
        return {}

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
    }

    async with httpx.AsyncClient(timeout=30, headers=headers, follow_redirects=True) as http_client:
        response = await http_client.get(url)
        response.raise_for_status()
        html = response.text

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "noscript", "svg"]):
        tag.decompose()

    title = (soup.title.string.strip() if soup.title and soup.title.string else "")

    logo_url = ""
    icon_link = soup.find("link", rel=lambda r: r and "icon" in r.lower())
    apple_icon = soup.find("link", rel=lambda r: r and "apple-touch-icon" in r.lower())
    og_image = soup.find("meta", attrs={"property": "og:image"}) or soup.find(
        "meta", attrs={"name": "og:image"}
    )
    if apple_icon and apple_icon.get("href"):
        logo_url = urljoin(url, apple_icon.get("href"))
    elif icon_link and icon_link.get("href"):
        logo_url = urljoin(url, icon_link.get("href"))
    elif og_image and og_image.get("content"):
        logo_url = urljoin(url, og_image.get("content"))

    meta_desc = ""
    meta = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
    if meta and meta.get("content"):
        meta_desc = meta["content"].strip()

    paragraphs = [p.get_text(" ").strip() for p in soup.find_all("p")[:40]]
    body_text = " ".join([p for p in paragraphs if p])
    body_text = body_text[:8000]

    # Lightweight local style stats to help the LLM produce a stable voice profile.
    # (We still ask the LLM to output the canonical voiceProfile object.)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", body_text) if s.strip()]
    avg_sentence_words = 0.0
    if sentences:
        avg_sentence_words = sum(len(re.findall(r"\b\w+\b", s)) for s in sentences) / max(len(sentences), 1)

    tech_terms = {
        "api",
        "sdk",
        "ai",
        "ml",
        "llm",
        "pipeline",
        "workflow",
        "automation",
        "integrations",
        "webhook",
        "oauth",
        "compliance",
        "uptime",
        "latency",
        "database",
        "postgres",
        "sql",
        "vector",
        "embedding",
        "crm",
        "etl",
    }
    words = [w.lower() for w in re.findall(r"\b\w+\b", body_text) if w]
    jargon_hits = sum(1 for w in words if w in tech_terms)
    jargon_density = (jargon_hits / max(len(words), 1))

    cliché_candidates = [
        "best in class",
        "cutting-edge",
        "innovative",
        "game changer",
        "seamless",
        "next-generation",
        "revolutionary",
        "unlock",
        "leverage",
        "synergy",
        "world-class",
        "end-to-end",
    ]
    body_lower = body_text.lower()
    found_cliches = [c for c in cliché_candidates if c in body_lower]

    head_text = ""
    if soup.head:
        head_text = " ".join(soup.head.get_text(" ").split())[:4000]
    style_text = " ".join([s.get_text(" ") for s in soup.find_all("style")[:5]])[:4000]

    inline_styles = " ".join(
        [
            tag.get("style")
            for tag in soup.find_all(style=True)[:50]
            if tag.get("style")
        ]
    )[:4000]

    prompt_context = f"""
URL: {url}
Title: {title}
Meta Description: {meta_desc}
Local Style Stats:
- avg_sentence_words: {avg_sentence_words:.1f}
- jargon_density: {jargon_density:.3f}
- cliche_hits: {', '.join(found_cliches) if found_cliches else '(none)'}
Head (truncated): {head_text}
Style Tags (truncated): {style_text}
Inline Styles (truncated): {inline_styles}
Page Text (truncated): {body_text}
"""

    prompt = _as_json_prompt(
    """Analyze this HTML and content and extract brand + style signals.

Return STRICT JSON with these exact camelCase fields:
{
    "companyName": "string",
    "productDescription": "string",
    "mainBenefit": "string",
    "uniqueMechanism": "string",
    "competitorContrast": "string",
    "primaryColor": "string",
    "fontStyle": "serif" | "sans" | "mono",
    "designVibe": "minimal" | "bold" | "tech",
    "voiceProfile": {
        "sentenceLength": "short" | "long",
        "jargonLevel": "tech" | "simple",
        "bannedWords": ["string"]
    }
}

VOICE PROFILE RULES (Vibe Decoder):
- sentenceLength: "short" if the writing uses punchy sentences (avg < ~14 words); else "long".
- jargonLevel: "tech" if jargon_density is clearly non-trivial; else "simple".
- bannedWords: list 5-15 clichés actually found on the page (avoid generic guesses). If none found, return [].

General rules:
- Use specific language grounded in the page content.
- If a field is unknown, return an empty string.
""",
        prompt_context,
    )

    data = await client.generate_json(prompt) or {}

    voice_profile = data.get("voiceProfile")
    if not isinstance(voice_profile, dict):
        voice_profile = {}

    return {
        "companyName": data.get("companyName", ""),
        "productDescription": data.get("productDescription", ""),
        "mainBenefit": data.get("mainBenefit", ""),
        "uniqueMechanism": data.get("uniqueMechanism", ""),
        "competitorContrast": data.get("competitorContrast", ""),
        "primaryColor": data.get("primaryColor", ""),
        "fontStyle": data.get("fontStyle", ""),
        "designVibe": data.get("designVibe", ""),
        "voiceProfile": {
            "sentenceLength": voice_profile.get("sentenceLength", ""),
            "jargonLevel": voice_profile.get("jargonLevel", ""),
            "bannedWords": voice_profile.get("bannedWords", []) or [],
        },
        "logoUrl": logo_url,
    }
