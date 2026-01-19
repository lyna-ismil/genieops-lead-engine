from __future__ import annotations
from typing import Optional
from sqlmodel import Session, select
from app.models.db import NurtureSequence as NurtureSequenceDB, NurtureStep as NurtureStepDB, LeadMagnet as LeadMagnetDB
from app.models.schemas import Email, EmailSequence, EmailSequenceCreate, EmailSequenceUpdate


def _parse_offset(delay: str) -> int:
    if not delay:
        return 0
    if delay.lower().startswith("day"):
        parts = delay.split(" ")
        for part in parts:
            if part.isdigit():
                return int(part)
    if delay.lower().startswith("immediate"):
        return 0
    return 0


def _to_schema(sequence: NurtureSequenceDB, steps: list[NurtureStepDB]) -> EmailSequence:
    emails = [
        Email(
            id=step.id,
            subject=step.subject,
            body=step.body,
            delay=f"Day {step.offset_days}" if step.offset_days else "Immediate",
            intent=step.intent or "",
        )
        for step in sorted(steps, key=lambda s: s.order)
    ]
    return EmailSequence(
        id=sequence.id,
        lead_magnet_id=sequence.lead_magnet_id or "",
        emails=emails,
        created_at=sequence.created_at,
    )


def list_sequences(session: Session) -> list[EmailSequence]:
    sequences = session.exec(select(NurtureSequenceDB)).all()
    results: list[EmailSequence] = []
    for seq in sequences:
        steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
        results.append(_to_schema(seq, steps))
    return results


def get_sequence(session: Session, sequence_id: str) -> Optional[EmailSequence]:
    seq = session.get(NurtureSequenceDB, sequence_id)
    if not seq:
        return None
    steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
    return _to_schema(seq, steps)


def create_sequence(session: Session, payload: EmailSequenceCreate, campaign_id: str | None = None) -> EmailSequence:
    resolved_campaign_id = campaign_id
    if not resolved_campaign_id and payload.lead_magnet_id:
        lm = session.get(LeadMagnetDB, payload.lead_magnet_id)
        if lm:
            resolved_campaign_id = lm.campaign_id
    if not resolved_campaign_id:
        resolved_campaign_id = payload.lead_magnet_id
    seq = NurtureSequenceDB(campaign_id=resolved_campaign_id, lead_magnet_id=payload.lead_magnet_id)
    session.add(seq)
    session.commit()
    session.refresh(seq)

    for idx, email in enumerate(payload.emails):
        step = NurtureStepDB(
            sequence_id=seq.id,
            order=idx + 1,
            subject=email.subject,
            body=email.body,
            offset_days=_parse_offset(email.delay),
            intent=email.intent,
            type="regular",
        )
        session.add(step)
    session.commit()
    steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
    return _to_schema(seq, steps)


def update_sequence(session: Session, sequence_id: str, payload: EmailSequenceUpdate) -> EmailSequence | None:
    seq = session.get(NurtureSequenceDB, sequence_id)
    if not seq:
        return None
    data = payload.model_dump(exclude_none=True)
    if "emails" in data:
        session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
        steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
        for step in steps:
            session.delete(step)
        for idx, email in enumerate(data["emails"]):
            step = NurtureStepDB(
                sequence_id=seq.id,
                order=idx + 1,
                subject=email.subject,
                body=email.body,
                offset_days=_parse_offset(email.delay),
                intent=email.intent,
                type="regular",
            )
            session.add(step)
    session.commit()
    steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
    return _to_schema(seq, steps)


def delete_sequence(session: Session, sequence_id: str) -> bool:
    seq = session.get(NurtureSequenceDB, sequence_id)
    if not seq:
        return False
    steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
    for step in steps:
        session.delete(step)
    session.delete(seq)
    session.commit()
    return True
