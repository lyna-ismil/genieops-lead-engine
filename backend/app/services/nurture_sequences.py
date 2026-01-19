from __future__ import annotations
from typing import Optional
from sqlmodel import Session, select
from app.models.db import NurtureSequence as NurtureSequenceDB
from app.models.schemas import NurtureSequence, NurtureSequenceCreate, NurtureSequenceUpdate


def _to_schema(item: NurtureSequenceDB) -> NurtureSequence:
    return NurtureSequence(
        id=item.id,
        campaign_id=item.campaign_id,
        lead_magnet_id=item.lead_magnet_id,
        name=item.name,
        created_at=item.created_at,
    )


def list_sequences(session: Session) -> list[NurtureSequence]:
    return [_to_schema(item) for item in session.exec(select(NurtureSequenceDB)).all()]


def get_sequence(session: Session, sequence_id: str) -> Optional[NurtureSequence]:
    item = session.get(NurtureSequenceDB, sequence_id)
    return _to_schema(item) if item else None


def create_sequence(session: Session, payload: NurtureSequenceCreate) -> NurtureSequence:
    item = NurtureSequenceDB(**payload.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_schema(item)


def update_sequence(session: Session, sequence_id: str, payload: NurtureSequenceUpdate) -> Optional[NurtureSequence]:
    item = session.get(NurtureSequenceDB, sequence_id)
    if not item:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(item, key, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_schema(item)


def delete_sequence(session: Session, sequence_id: str) -> bool:
    item = session.get(NurtureSequenceDB, sequence_id)
    if not item:
        return False
    session.delete(item)
    session.commit()
    return True