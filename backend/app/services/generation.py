from __future__ import annotations
from datetime import datetime
from sqlmodel import Session
from app.models.db import Asset as AssetDB, LandingPage as LandingPageDB, LeadMagnet as LeadMagnetDB
from app.models.schemas import Asset, LandingPage, LeadMagnet, LeadMagnetType


def ideate_for_campaign(_: str) -> list[LeadMagnet]:
    ideas = []
    for i in range(3):
        idea = LeadMagnet(
            id=f"idea-{i + 1}",
            campaign_id="",
            title=f"Lead Magnet Idea {i + 1}",
            type=LeadMagnetType.checklist,
            pain_point_alignment="Placeholder pain point alignment",
            value_promise="Placeholder value promise",
            conversion_score=7.5,
            format_recommendation="Checklist",
            is_selected=False,
            idea_payload=None,
            created_at=datetime.utcnow(),
        )
        ideas.append(idea)
    return ideas


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
