import time
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.responses import ok
from app.db.session import get_session
from app.models.db import SocialConnection
from app.services import linkedin
from pydantic import BaseModel

router = APIRouter()


class ShareRequest(BaseModel):
    text: str
    landing_page_url: str | None = None


@router.get("/auth/linkedin")
def linkedin_login(redirect_uri: str):
    try:
        url = linkedin.get_auth_url(redirect_uri)
        return ok({"url": url})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/auth/linkedin/callback")
async def linkedin_callback(code: str, redirect_uri: str, db: Session = Depends(get_session)):
    try:
        # 1. Exchange Code for Token
        token_data = await linkedin.exchange_code(code, redirect_uri)
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="LinkedIn did not return an access token")

        # 2. Get User Info (OpenID Connect)
        user_info = await linkedin.get_user_info(access_token)

        urn_id = user_info.get("sub")
        name = user_info.get("name")
        email = user_info.get("email")

        if not urn_id:
            raise HTTPException(status_code=400, detail="Could not retrieve LinkedIn User ID (sub)")

        expires_at: int | None = None
        expires_in = token_data.get("expires_in")
        if isinstance(expires_in, (int, float)):
            expires_at = int(time.time()) + int(expires_in)
        elif isinstance(expires_in, str):
            try:
                expires_at = int(time.time()) + int(float(expires_in))
            except ValueError:
                expires_at = None

        existing = db.exec(
            select(SocialConnection)
            .where(SocialConnection.provider == "linkedin")
            .where(SocialConnection.provider_user_id == urn_id)
        ).first()
        if existing:
            existing.access_token = access_token
            existing.expires_at = expires_at
            db.add(existing)
        else:
            db.add(
                SocialConnection(
                    provider="linkedin",
                    provider_user_id=urn_id,
                    access_token=access_token,
                    expires_at=expires_at,
                )
            )
        db.commit()

        return ok({"connected": True, "user": name})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"LinkedIn Auth Error: {e}")
        raise HTTPException(status_code=400, detail="Failed to authenticate with LinkedIn")


@router.post("/linkedin/share")
async def linkedin_share(payload: ShareRequest, db: Session = Depends(get_session)):
    conn = db.exec(
        select(SocialConnection)
        .where(SocialConnection.provider == "linkedin")
        .order_by(SocialConnection.created_at.desc())
    ).first()
    if not conn:
        raise HTTPException(status_code=401, detail="Not connected to LinkedIn")
    try:
        res = await linkedin.publish_share(
            access_token=conn.access_token,
            person_urn_id=conn.provider_user_id,
            text=payload.text,
            landing_page_url=payload.landing_page_url,
        )
        return ok({"success": True, "linkedin_post_id": res.get("id")})
    except Exception as e:
        print(f"Share Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to publish to LinkedIn: {str(e)}")


@router.get("/status")
def social_status(db: Session = Depends(get_session)):
    connected = (
        db.exec(
            select(SocialConnection)
            .where(SocialConnection.provider == "linkedin")
            .order_by(SocialConnection.created_at.desc())
        ).first()
        is not None
    )
    return ok({
        "linkedin_connected": connected,
        "user": None,
    })
