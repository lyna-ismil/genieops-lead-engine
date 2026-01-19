from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.models.schemas import EmailSequenceCreate, EmailSequenceUpdate
from app.services import email_sequences
from app.db.session import get_session

router = APIRouter()


@router.get("", response_model=None)
def list_sequences(session: Session = Depends(get_session)):
    return ok(email_sequences.list_sequences(session))


@router.post("", response_model=None)
def create_sequence(payload: EmailSequenceCreate, session: Session = Depends(get_session)):
    return ok(email_sequences.create_sequence(session, payload))


@router.get("/{sequence_id}", response_model=None)
def get_sequence(sequence_id: str, session: Session = Depends(get_session)):
    seq = email_sequences.get_sequence(session, sequence_id)
    if not seq:
        raise HTTPException(status_code=404, detail="Email sequence not found")
    return ok(seq)


@router.put("/{sequence_id}", response_model=None)
def update_sequence(sequence_id: str, payload: EmailSequenceUpdate, session: Session = Depends(get_session)):
    updated = email_sequences.update_sequence(session, sequence_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Email sequence not found")
    return ok(updated)


@router.delete("/{sequence_id}", response_model=None)
def delete_sequence(sequence_id: str, session: Session = Depends(get_session)):
    if not email_sequences.delete_sequence(session, sequence_id):
        raise HTTPException(status_code=404, detail="Email sequence not found")
    return ok({"deleted": True})
