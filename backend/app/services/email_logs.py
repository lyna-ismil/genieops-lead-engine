from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select
from app.models.db import EmailLog as EmailLogDB, NurtureSequence as NurtureSequenceDB
from app.models.schemas import EmailLog


def _to_schema(item: EmailLogDB) -> EmailLog:
    return EmailLog(
        id=item.id,
        lead_id=item.lead_id,
        sequence_id=item.sequence_id,
        step_id=item.step_id,
        subject=item.subject,
        body=item.body,
        status=item.status,
        provider_message_id=item.provider_message_id,
        error_message=item.error_message,
        scheduled_at=item.scheduled_at,
        sent_at=item.sent_at,
        created_at=item.created_at,
    )


def list_logs(
    session: Session,
    lead_id: Optional[str] = None,
    campaign_id: Optional[str] = None,
    limit: int = 200,
) -> list[EmailLog]:
    stmt = select(EmailLogDB)
    if lead_id:
        stmt = stmt.where(EmailLogDB.lead_id == lead_id)
    if campaign_id:
        seq_ids = session.exec(
            select(NurtureSequenceDB.id).where(NurtureSequenceDB.campaign_id == campaign_id)
        ).all()
        if seq_ids:
            stmt = stmt.where(EmailLogDB.sequence_id.in_(seq_ids))
        else:
            return []
    stmt = stmt.order_by(EmailLogDB.created_at.desc()).limit(limit)
    return [_to_schema(item) for item in session.exec(stmt).all()]


def list_due(session: Session, now: datetime) -> list[EmailLogDB]:
    stmt = (
        select(EmailLogDB)
        .where(EmailLogDB.status == "queued")
        .where(EmailLogDB.scheduled_at <= now)
        .order_by(EmailLogDB.scheduled_at.asc())
        .limit(100)
    )
    return session.exec(stmt).all()