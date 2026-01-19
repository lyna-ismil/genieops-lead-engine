from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.models.schemas import LeadMagnetCreate, LeadMagnetUpdate
from app.services import lead_magnets
from app.db.session import get_session

router = APIRouter()


@router.get("", response_model=None)
def list_lead_magnets(session: Session = Depends(get_session)):
    return ok(lead_magnets.list_lead_magnets(session))


@router.post("", response_model=None)
def create_lead_magnet(payload: LeadMagnetCreate, session: Session = Depends(get_session)):
    return ok(lead_magnets.create_lead_magnet(session, payload))


@router.get("/{lead_magnet_id}", response_model=None)
def get_lead_magnet(lead_magnet_id: str, session: Session = Depends(get_session)):
    item = lead_magnets.get_lead_magnet(session, lead_magnet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Lead magnet not found")
    return ok(item)


@router.put("/{lead_magnet_id}", response_model=None)
def update_lead_magnet(lead_magnet_id: str, payload: LeadMagnetUpdate, session: Session = Depends(get_session)):
    updated = lead_magnets.update_lead_magnet(session, lead_magnet_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Lead magnet not found")
    return ok(updated)


@router.delete("/{lead_magnet_id}", response_model=None)
def delete_lead_magnet(lead_magnet_id: str, session: Session = Depends(get_session)):
    if not lead_magnets.delete_lead_magnet(session, lead_magnet_id):
        raise HTTPException(status_code=404, detail="Lead magnet not found")
    return ok({"deleted": True})
