from __future__ import annotations
from typing import Optional
from sqlmodel import Session, select
from app.models.db import NurtureStep as NurtureStepDB
from app.models.schemas import NurtureStep, NurtureStepCreate, NurtureStepUpdate


def _to_schema(item: NurtureStepDB) -> NurtureStep:
    return NurtureStep(
        id=item.id,
        sequence_id=item.sequence_id,
        order=item.order,
        subject=item.subject,
        body=item.body,
        offset_days=item.offset_days,
        intent=item.intent,
        type=item.type,
        created_at=item.created_at,
    )


def list_steps(session: Session, sequence_id: Optional[str] = None) -> list[NurtureStep]:
    stmt = select(NurtureStepDB)
    if sequence_id:
        stmt = stmt.where(NurtureStepDB.sequence_id == sequence_id)
    return [_to_schema(item) for item in session.exec(stmt).all()]


def get_step(session: Session, step_id: str) -> Optional[NurtureStep]:
    item = session.get(NurtureStepDB, step_id)
    return _to_schema(item) if item else None


def create_step(session: Session, payload: NurtureStepCreate) -> NurtureStep:
    item = NurtureStepDB(**payload.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_schema(item)


def update_step(session: Session, step_id: str, payload: NurtureStepUpdate) -> Optional[NurtureStep]:
    item = session.get(NurtureStepDB, step_id)
    if not item:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(item, key, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_schema(item)


def delete_step(session: Session, step_id: str) -> bool:
    item = session.get(NurtureStepDB, step_id)
    if not item:
        return False
    session.delete(item)
    session.commit()
    return True