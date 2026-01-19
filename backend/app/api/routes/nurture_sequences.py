from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.db.session import get_session
from app.models.schemas import NurtureSequenceCreate, NurtureSequenceUpdate
from app.services import nurture_sequences

router = APIRouter()


@router.get("", response_model=None)
def list_sequences(session: Session = Depends(get_session)):
    return ok(nurture_sequences.list_sequences(session))


@router.get("/{sequence_id}", response_model=None)
def get_sequence(sequence_id: str, session: Session = Depends(get_session)):
    item = nurture_sequences.get_sequence(session, sequence_id)
    if not item:
        raise HTTPException(status_code=404, detail="Nurture sequence not found")
    return ok(item)


@router.post("", response_model=None)
def create_sequence(payload: NurtureSequenceCreate, session: Session = Depends(get_session)):
    return ok(nurture_sequences.create_sequence(session, payload))


@router.put("/{sequence_id}", response_model=None)
def update_sequence(sequence_id: str, payload: NurtureSequenceUpdate, session: Session = Depends(get_session)):
    updated = nurture_sequences.update_sequence(session, sequence_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Nurture sequence not found")
    return ok(updated)


@router.delete("/{sequence_id}", response_model=None)
def delete_sequence(sequence_id: str, session: Session = Depends(get_session)):
    if not nurture_sequences.delete_sequence(session, sequence_id):
        raise HTTPException(status_code=404, detail="Nurture sequence not found")
    return ok({"deleted": True})