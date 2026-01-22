from __future__ import annotations

from urllib.parse import quote_plus
import httpx

from app.core.config import get_settings


async def search_stock_image(query: str) -> str:
    """Search Unsplash for a stock image. Returns a fallback gradient URL on failure."""
    fallback = "https://bg.ibelick.com/"
    if not query:
        return fallback

    settings = get_settings()
    if not settings.unsplash_access_key:
        print("⚠️ Unsplash Key missing, using fallback.")
        return fallback

    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": query,
        "per_page": 1,
        "orientation": "landscape",
    }
    headers = {
        "Authorization": f"Client-ID {settings.unsplash_access_key}",
        "Accept-Version": "v1",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                print(f"❌ Unsplash Error {response.status_code}: {response.text}")
                return fallback
            data = response.json()
            results = data.get("results", [])
            if results:
                return results[0].get("urls", {}).get("regular") or fallback
    except Exception:
        return fallback

    return fallback
