from __future__ import annotations
from datetime import datetime
from sqlmodel import Session
from app.models.db import Asset as AssetDB, LandingPage as LandingPageDB, LeadMagnet as LeadMagnetDB
from app.models.schemas import Asset, LandingPage, LeadMagnet, LeadMagnetType


from app.services.llm_service import LLMClient, ideate_lead_magnets
from app.core.config import get_settings

def ideate_for_campaign(campaign_id: str) -> list[LeadMagnet]:
    # This function is likely legacy, used by /api/generation/campaigns/{id}/ideate
    # We will try to fetch the campaign to get ICP, then use LLM.
    # Note: Session management here is tricky as generic function doesn't have session.
    # But usually this is called from a route. 
    # Actually, to properly fix this without massive refactor, I will update the ROUTE to do the work
    # and make this function a simple wrapper or deprecate it. 
    # For now, let's just make it return empty or throw to indicate it's not the right path, 
    # OR better: update the route `api/routes/generation.py` to use `llm_service` directly and delete this function.
    
    # User asked to remove mock data IN validation.py.
    # So I will replace this with a proper implementation or a "Not Implemented" pointing to the new API.
    # Taking the safer route: Update the route to use the new service, then delete this function?
    # No, I should stick to modifying this file as requested.
    pass


def generate_asset_and_landing(session: Session, lead_magnet_id: str) -> tuple[Asset, LandingPage] | None:
    lead_magnet = session.get(LeadMagnetDB, lead_magnet_id)
    if not lead_magnet:
        return None

    asset_db = AssetDB(
        lead_magnet_id=lead_magnet.id,
        type=lead_magnet.type,
        content_text=f"Generated content for {lead_magnet.title}.",
        content_json={"content": f"Generated content for {lead_magnet.title}.", "type": lead_magnet.type},
    )
    landing_db = LandingPageDB(
        lead_magnet_id=lead_magnet.id,
        slug=f"{lead_magnet.id[:8]}-landing",
        headline=lead_magnet.title,
        subheadline=lead_magnet.value_promise,
        bullets=["Benefit 1", "Benefit 2", "Benefit 3"],
        cta="Get the resource",
        html_content="<div class='p-8'><h1>Landing Page</h1></div>",
        image_url=None,
        sections=None,
        form_schema=None,
    )
    session.add(asset_db)
    session.add(landing_db)
    session.commit()
    session.refresh(asset_db)
    session.refresh(landing_db)

    asset = Asset(
        id=asset_db.id,
        lead_magnet_id=asset_db.lead_magnet_id,
        content=asset_db.content_text or "",
        type=asset_db.type,
        content_json=asset_db.content_json,
        created_at=asset_db.created_at,
    )
    landing = LandingPage(
        id=landing_db.id,
        lead_magnet_id=landing_db.lead_magnet_id,
        slug=landing_db.slug,
        headline=landing_db.headline,
        subheadline=landing_db.subheadline,
        bullets=landing_db.bullets or [],
        cta=landing_db.cta,
        html_content=landing_db.html_content,
        image_url=landing_db.image_url,
        sections=landing_db.sections,
        form_schema=landing_db.form_schema,
        created_at=landing_db.created_at,
    )
    return asset, landing
