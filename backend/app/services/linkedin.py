import httpx
from urllib.parse import urlencode
from app.core.config import get_settings

settings = get_settings()

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_API_URL = "https://api.linkedin.com/v2"


def get_auth_url(redirect_uri: str) -> str:
    if not settings.linkedin_client_id:
        raise ValueError("LinkedIn client_id is not configured")

    scopes = ["openid", "profile", "email", "w_member_social"]

    params = {
        "response_type": "code",
        "client_id": settings.linkedin_client_id,
        "redirect_uri": redirect_uri,
        "scope": " ".join(scopes),
    }
    return f"{LINKEDIN_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str, redirect_uri: str) -> dict:
    if not settings.linkedin_client_id or not settings.linkedin_client_secret:
        raise ValueError("LinkedIn credentials not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            LINKEDIN_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.linkedin_client_id,
                "client_secret": settings.linkedin_client_secret,
            },
        )

        if response.status_code != 200:
            raise ValueError(f"Token Exchange Failed: {response.text}")

        return response.json()


async def get_user_info(access_token: str) -> dict:
    """
    Uses OpenID Connect /userinfo endpoint.
    Returns standard OIDC claims: sub, name, given_name, family_name, picture, email.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{LINKEDIN_API_URL}/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if response.status_code != 200:
            raise ValueError(f"Profile Fetch Failed: {response.text}")

        return response.json()


async def publish_share(
    access_token: str,
    person_urn_id: str,
    text: str,
    landing_page_url: str | None = None,
) -> dict:
    """
    Publishes a UGC Post.
    person_urn_id: The 'sub' field from the OIDC userinfo response.
    """
    author_urn = f"urn:li:person:{person_urn_id}"

    share_content = {
        "shareCommentary": {"text": text},
        "shareMediaCategory": "NONE",
    }

    if landing_page_url:
        share_content["shareMediaCategory"] = "ARTICLE"
        share_content["media"] = [
            {
                "status": "READY",
                "description": {"text": "Learn more"},
                "originalUrl": landing_page_url,
            }
        ]

    body = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {"com.linkedin.ugc.ShareContent": share_content},
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{LINKEDIN_API_URL}/ugcPosts",
            json=body,
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json",
            },
        )

        if response.status_code not in (200, 201):
            raise ValueError(f"Post Failed: {response.text}")

        return response.json()


async def extract_post_context(content: str, llm_client) -> "ICPProfile":
    """
    Analyzes a LinkedIn post (URL or text) and extracts a likely ICP Profile.
    """
    from app.models.schemas import ICPProfile
    import re

    text_content = content.strip()
    
    # Simple URL fetching if it looks like a link
    if text_content.startswith("http"):
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
                # Mock a browser UA to avoid immediate 403s from some sites, though LinkedIn public posts are hard to scrape.
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
                resp = await client.get(text_content, headers=headers)
                if resp.status_code == 200:
                    raw_html = resp.text
                    # Try to grab og:description or article body
                    desc_match = re.search(r'<meta property="og:description" content="(.*?)"', raw_html)
                    if desc_match:
                        text_content = f"URL: {text_content}\nExtracted Meta: {desc_match.group(1)}\n\nFull Body Sample: {raw_html[:1000]}"
                    else:
                        text_content = f"URL: {text_content}\n\nContent Sample: {raw_html[:2000]}"
                else:
                    print(f"LinkedIn scrape failed with status {resp.status_code}")
                    # Fallback: treat as raw text/URL
        except Exception as e:
            print(f"LinkedIn scrape error: {e}")
            # Fallback: treat as raw text/URL, do not modify text_content
            pass

    prompt = f"""
    Analyze the following LinkedIn post content (or context derived from a URL) and extract the Ideal Customer Profile (ICP) targeted by this content.
    
    Content:
    {text_content}
    
    Return strictly valid JSON matching this schema:
    {{
      "role": "Target Job Title",
      "industry": "Target Industry",
      "companySize": "Estimated Company Size (e.g. 10-50 employees) or empty",
      "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
      "goals": ["goal 1", "goal 2"]
    }}
    
    If the content is vague, infer the most likely B2B audience.
    """
    
    data = await llm_client.generate_json(prompt)
    if not data:
        # Fallback default
        return ICPProfile(role="Unknown", industry="Unknown", pain_points=["Could not extract"], goals=["Could not extract"])
        
    return ICPProfile(**data)
