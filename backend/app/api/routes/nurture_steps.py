from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.db.session import get_session
from app.models.schemas import NurtureStepCreate, NurtureStepUpdate
from app.services import nurture_steps

router = APIRouter()


@router.get("", response_model=None)
def list_steps(sequence_id: str | None = None, session: Session = Depends(get_session)):
    return ok(nurture_steps.list_steps(session, sequence_id))


@router.get("/{step_id}", response_model=None)
def get_step(step_id: str, session: Session = Depends(get_session)):
    item = nurture_steps.get_step(session, step_id)
    if not item:
        raise HTTPException(status_code=404, detail="Nurture step not found")
    return ok(item)


@router.post("", response_model=None)
def create_step(payload: NurtureStepCreate, session: Session = Depends(get_session)):
    return ok(nurture_steps.create_step(session, payload))


@router.put("/{step_id}", response_model=None)
def update_step(step_id: str, payload: NurtureStepUpdate, session: Session = Depends(get_session)):
    updated = nurture_steps.update_step(session, step_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Nurture step not found")
    return ok(updated)


@router.delete("/{step_id}", response_model=None)
def delete_step(step_id: str, session: Session = Depends(get_session)):
    if not nurture_steps.delete_step(session, step_id):
        raise HTTPException(status_code=404, detail="Nurture step not found")
    return ok({"deleted": True})