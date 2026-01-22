from __future__ import annotations
from sqlmodel import Session, select
from app.models.db import LeadMagnet as LeadMagnetDB
from app.models.schemas import LeadMagnet, LeadMagnetCreate, LeadMagnetUpdate


def _to_schema(db: LeadMagnetDB) -> LeadMagnet:
    return LeadMagnet(
        id=db.id,
        campaign_id=db.campaign_id,
        title=db.title,
        type=db.type,
        pain_point_alignment=db.pain_point_alignment,
        value_promise=db.value_promise,
        conversion_score=db.conversion_score,
        format_recommendation=db.format_recommendation,
        is_selected=db.is_selected,
        idea_payload=db.idea_payload,
        strategy_summary=getattr(db, "strategy_summary", None),
        created_at=db.created_at,
    )


def list_lead_magnets(session: Session) -> list[LeadMagnet]:
    results = session.exec(select(LeadMagnetDB)).all()
    return [_to_schema(item) for item in results]


def get_lead_magnet(session: Session, lead_magnet_id: str) -> LeadMagnet | None:
    item = session.get(LeadMagnetDB, lead_magnet_id)
    return _to_schema(item) if item else None


def create_lead_magnet(session: Session, payload: LeadMagnetCreate) -> LeadMagnet:
    db_item = LeadMagnetDB(
        campaign_id=payload.campaign_id,
        title=payload.title,
        type=payload.type.value if hasattr(payload.type, "value") else payload.type,
        pain_point_alignment=payload.pain_point_alignment,
        value_promise=payload.value_promise,
        conversion_score=payload.conversion_score,
        format_recommendation=payload.format_recommendation,
        is_selected=payload.is_selected,
        idea_payload=payload.idea_payload,
        strategy_summary=payload.strategy_summary,
    )
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return _to_schema(db_item)


def update_lead_magnet(session: Session, lead_magnet_id: str, payload: LeadMagnetUpdate) -> LeadMagnet | None:
    existing = session.get(LeadMagnetDB, lead_magnet_id)
    if not existing:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, value in data.items():
        if key == "type" and hasattr(value, "value"):
            value = value.value
        setattr(existing, key, value)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return _to_schema(existing)


def delete_lead_magnet(session: Session, lead_magnet_id: str) -> bool:
    existing = session.get(LeadMagnetDB, lead_magnet_id)
    if not existing:
        return False
    session.delete(existing)
    session.commit()
    return True
