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
        if provider == "openai":
            return await self._openai_json(prompt)
        return await self._gemini_json(prompt)

    async def generate_text(self, prompt: str) -> str:
        provider = (self.settings.llm_provider or "").lower()
        if provider == "openai":
            return await self._openai_text(prompt)
        return await self._gemini_text(prompt)

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


async def ideate_lead_magnets(client: LLMClient, icp: ICPProfile) -> list[dict]:
    prompt = _as_json_prompt(
        "Generate 3 high-conversion lead magnet ideas with type, pain point alignment, value promise, estimated conversion score, and format recommendation.",
        f"ICP role: {icp.role}\nIndustry: {icp.industry}\nCompany size: {icp.company_size}\nPain points: {', '.join(icp.pain_points)}\nGoals: {', '.join(icp.goals)}",
    )
    data = await client.generate_json(prompt)
    if isinstance(data, dict):
        data = data.get("ideas") or data.get("items") or []
    return data or []


async def generate_asset(client: LLMClient, idea: LeadMagnetIdea, icp: ICPProfile) -> dict:
    prompt = _as_json_prompt(
        "Create lead magnet content based on the type. Return {content, type, contentJson}. Content should be markdown or structured text.",
        f"Idea: {idea.title}\nType: {idea.type}\nValue: {idea.value_promise}\nICP: {icp.role} in {icp.industry}",
    )
    return await client.generate_json(prompt) or {}


async def generate_landing_page(client: LLMClient, idea: LeadMagnetIdea, asset: GeneratedAsset, image_url: Optional[str]) -> dict:
    img = image_url or "https://placehold.co/800x600/e2e8f0/1e293b?text=Hero+Image"
    prompt = _as_json_prompt(
        "Write a high-converting landing page. Return {headline, subheadline, bullets, cta, htmlContent, sections, formSchema}. Use Tailwind CDN classes in htmlContent. Use the provided image URL in the hero image.",
        f"Lead magnet: {idea.title}\nAsset excerpt: {asset.content[:400]}\nImage URL: {img}",
    )
    return await client.generate_json(prompt) or {}


async def generate_thank_you_page(client: LLMClient, idea: LeadMagnetIdea) -> dict:
    prompt = _as_json_prompt(
        "Write a concise thank you page. Return {headline, body, cta, htmlContent}.",
        f"Lead magnet: {idea.title}\nValue: {idea.value_promise}",
    )
    return await client.generate_json(prompt) or {}


async def generate_nurture_sequence(client: LLMClient, idea: LeadMagnetIdea) -> list[dict]:
    prompt = _as_json_prompt(
        "Write a 3-5 email nurture sequence. Return an array of {subject, body, delay, intent}.",
        f"Lead magnet: {idea.title}",
    )
    data = await client.generate_json(prompt)
    if isinstance(data, dict):
        data = data.get("emails") or data.get("items") or []
    return data or []


async def generate_upgrade_offer(client: LLMClient, idea: LeadMagnetIdea, emails: list[Email]) -> dict:
    prompt = _as_json_prompt(
        "Suggest an upgrade offer and write copy. Return {positioning, offerCopy, cta}.",
        f"Lead magnet: {idea.title}\nEmails: {len(emails)}",
    )
    return await client.generate_json(prompt) or {}


async def generate_linkedin_post(client: LLMClient, idea: LeadMagnetIdea, landing_page: LandingPageConfig) -> str:
    prompt = f"""Write a LinkedIn post to promote the lead magnet "{idea.title}".
Headline: {landing_page.headline}
Key benefits: {', '.join(landing_page.bullets)}
Rules: Educational first, hook in the first line, CTA at end to check the link. No hashtag spam.
"""
    return await client.generate_text(prompt)


async def generate_hero_image(client: LLMClient, idea: LeadMagnetIdea, icp: ICPProfile) -> str:
    if (client.settings.llm_provider or "").lower() != "gemini":
        return ""
    if not client.settings.llm_api_key:
        raise RuntimeError("Missing LLM API key")
    model = client.settings.llm_model or "gemini-2.5-flash-image"
    prompt = (
        "Generate a modern, high-quality, flat-style illustration or photo for a landing page hero section. "
        f"Subject: {idea.title}. Context: {idea.value_promise}. Audience: {icp.role} in {icp.industry}. "
        "Style: Professional, clean, corporate, trustworthy. Do not include text in the image."
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
