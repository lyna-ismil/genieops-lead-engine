import httpx
from app.core.config import get_settings

settings = get_settings()

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_API_URL = "https://api.linkedin.com/v2"

def get_auth_url(redirect_uri: str) -> str:
    params = {
        "response_type": "code",
        "client_id": settings.linkedin_client_id,
        "redirect_uri": redirect_uri,
        "scope": "w_member_social profile",
    }
    query = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{LINKEDIN_AUTH_URL}?{query}"

async def exchange_code(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(LINKEDIN_TOKEN_URL, data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.linkedin_client_id,
            "client_secret": settings.linkedin_client_secret,
        })
        response.raise_for_status()
        return response.json()

async def get_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{LINKEDIN_API_URL}/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        response.raise_for_status()
        return response.json()

async def publish_share(access_token: str, urn: str, text: str, landing_page_url: str = None) -> dict:
    """
    Publishes a text post (share) to LinkedIn. 
    Note: The structure for UGC posts can be complex. This is a simplified version (v2/ugcPosts).
    """
    
    share_media = []
    if landing_page_url:
        share_media = [{
            "status": "READY",
            "description": {
                "text": "Check this out!"
            },
            "media": "urn:li:digitalmediaAsset:C5500AQMqK..." # Placeholder if uploading, but for links:
            # Actually for links we usually use 'article' logic or just text. 
            # For simplicity in this MVP, we will just append the link to the text 
            # because native link attachments require more distinct payload structures.
        }]
    
    # Appending link to text is safest for MVP
    full_text = text
    if landing_page_url:
        full_text += f"\n\n{landing_page_url}"

    body = {
        "author": f"urn:li:person:{urn}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": full_text
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{LINKEDIN_API_URL}/ugcPosts", json=body, headers={
             "Authorization": f"Bearer {access_token}",
             "X-Restli-Protocol-Version": "2.0.0"
        })
        response.raise_for_status()
        return response.json()
