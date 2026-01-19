from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.db.session import get_session
from app.services import email_logs

router = APIRouter()


@router.get("", response_model=None)
def list_logs(lead_id: str | None = None, campaign_id: str | None = None, session: Session = Depends(get_session)):
    return ok(email_logs.list_logs(session, lead_id=lead_id, campaign_id=campaign_id))