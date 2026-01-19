from __future__ import annotations
from sqlmodel import Session, select
from app.models.db import Campaign as CampaignDB
from app.models.schemas import Campaign, CampaignCreate, CampaignUpdate, ICPProfile


def _to_schema(db: CampaignDB) -> Campaign:
    return Campaign(
        id=db.id,
        name=db.name,
        status=db.status,
        icp=ICPProfile(
            role=db.icp_role,
            industry=db.icp_industry,
            company_size=db.icp_company_size or "",
            pain_points=db.icp_pain_points or [],
            goals=db.icp_goals or [],
        ),
        offer_type=db.offer_type,
        brand_voice=db.brand_voice,
        target_conversion=db.target_conversion,
        created_at=db.created_at,
    )


def list_campaigns(session: Session) -> list[Campaign]:
    results = session.exec(select(CampaignDB)).all()
    return [_to_schema(item) for item in results]


def get_campaign(session: Session, campaign_id: str) -> Campaign | None:
    item = session.get(CampaignDB, campaign_id)
    return _to_schema(item) if item else None


def create_campaign(session: Session, payload: CampaignCreate) -> Campaign:
    db_item = CampaignDB(
        name=payload.name,
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
        icp_role=payload.icp.role,
        icp_industry=payload.icp.industry,
        icp_company_size=payload.icp.company_size,
        icp_pain_points=payload.icp.pain_points,
        icp_goals=payload.icp.goals,
        offer_type=payload.offer_type,
        brand_voice=payload.brand_voice,
        target_conversion=payload.target_conversion,
    )
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return _to_schema(db_item)


def update_campaign(session: Session, campaign_id: str, payload: CampaignUpdate) -> Campaign | None:
    existing = session.get(CampaignDB, campaign_id)
    if not existing:
        return None
    data = payload.model_dump(exclude_none=True)
    if "icp" in data:
        icp = data.pop("icp")
        existing.icp_role = icp.role
        existing.icp_industry = icp.industry
        existing.icp_company_size = icp.company_size
        existing.icp_pain_points = icp.pain_points
        existing.icp_goals = icp.goals
    for key, value in data.items():
        if key == "status" and hasattr(value, "value"):
            value = value.value
        setattr(existing, key, value)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return _to_schema(existing)


def delete_campaign(session: Session, campaign_id: str) -> bool:
    existing = session.get(CampaignDB, campaign_id)
    if not existing:
        return False
    session.delete(existing)
    session.commit()
    return True
