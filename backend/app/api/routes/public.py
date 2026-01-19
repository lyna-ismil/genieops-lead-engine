from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.core.responses import ok
from app.db.session import get_session
from app.models.db import LandingPage as LandingPageDB
from app.models.schemas import LeadCreate
from app.services.leads import create_lead, create_email_log

router = APIRouter()


@router.get("/landing/{slug_or_id}", response_model=None)
def get_landing_page(slug_or_id: str, session: Session = Depends(get_session)):
    landing = session.get(LandingPageDB, slug_or_id)
    if not landing:
        landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug_or_id)).first()
    if not landing:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return ok(landing)


@router.post("/leads", response_model=None)
def submit_lead(payload: LeadCreate, session: Session = Depends(get_session)):
    lead = create_lead(session, payload)
    create_email_log(session, lead.id, "Welcome", "Thanks for downloading the resource.")
    return ok(lead)
