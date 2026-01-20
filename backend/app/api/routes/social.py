from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session
from app.core.responses import ok
from app.db.session import get_session
from app.services import linkedin
from pydantic import BaseModel

router = APIRouter()

# Simple in-memory storage for tokens for this MVP
# In production, store this in the DB linked to the current user/session
TOKEN_STORE = {}

class ShareRequest(BaseModel):
    text: str
    landing_page_url: str | None = None

@router.get("/auth/linkedin")
def linkedin_login(redirect_uri: str):
    url = linkedin.get_auth_url(redirect_uri)
    return ok({"url": url})

@router.get("/auth/linkedin/callback")
async def linkedin_callback(code: str, redirect_uri: str):
    try:
        token_data = await linkedin.exchange_code(code, redirect_uri)
        access_token = token_data.get("access_token")
        
        # Get user info to get the URN (ID)
        user_info = await linkedin.get_user_info(access_token)
        urn = user_info.get("id") # Field is 'id' which acts as part of the URN
        
        # Store basic session info
        TOKEN_STORE["current"] = {
            "access_token": access_token, 
            "urn": urn,
            "name": f"{user_info.get('localizedFirstName')} {user_info.get('localizedLastName')}"
        }
        
        return ok({"connected": True, "user": TOKEN_STORE["current"]["name"]})
    except Exception as e:
        print(f"LinkedIn Auth Error: {e}")
        raise HTTPException(status_code=400, detail="Failed to authenticate with LinkedIn")

@router.post("/linkedin/share")
async def linkedin_share(payload: ShareRequest):
    if "current" not in TOKEN_STORE:
        raise HTTPException(status_code=401, detail="Not connected to LinkedIn")
        
    session = TOKEN_STORE["current"]
    try:
        res = await linkedin.publish_share(
            session["access_token"], 
            session["urn"], 
            payload.text, 
            payload.landing_page_url
        )
        return ok({"success": True, "linkedin_post_id": res.get("id")})
    except Exception as e:
        print(f"Share Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to publish to LinkedIn")

@router.get("/status")
def social_status():
    connected = "current" in TOKEN_STORE
    return ok({
        "linkedin_connected": connected, 
        "user": TOKEN_STORE["current"]["name"] if connected else None
    })
