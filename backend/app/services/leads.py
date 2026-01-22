from __future__ import annotations
from datetime import datetime
from sqlmodel import Session
from app.models.db import Lead as LeadDB, EmailLog as EmailLogDB
from app.models.schemas import LeadCreate, EmailLog


def create_lead(session: Session, payload: LeadCreate) -> LeadDB:
    db_item = LeadDB(
        campaign_id=payload.campaign_id,
        lead_magnet_id=payload.lead_magnet_id,
        landing_page_id=payload.landing_page_id,
        email=payload.email,
        name=payload.name,
        company=payload.company,
    )
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_email_log(session: Session, lead_id: str, subject: str, body: str) -> EmailLog:
    db_item = EmailLogDB(
        lead_id=lead_id,
        sequence_id=None,
        step_id=None,
        subject=subject,
        body=body,
        status="queued",
        scheduled_at=datetime.utcnow(),
        sent_at=None,
    )
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return EmailLog(
        id=db_item.id,
        lead_id=db_item.lead_id,
        sequence_id=db_item.sequence_id,
        step_id=db_item.step_id,
        subject=db_item.subject,
        body=db_item.body,
        status=db_item.status,
        provider_message_id=db_item.provider_message_id,
        error_message=db_item.error_message,
        scheduled_at=db_item.scheduled_at,
        sent_at=db_item.sent_at,
        created_at=db_item.created_at,
    )
