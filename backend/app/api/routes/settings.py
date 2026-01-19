from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.models.schemas import SettingsUpdate
from app.services import settings
from app.db.session import get_session

router = APIRouter()


@router.get("", response_model=None)
def get_settings(session: Session = Depends(get_session)):
    return ok(settings.get_app_settings(session))


@router.put("", response_model=None)
def update_settings(payload: SettingsUpdate, session: Session = Depends(get_session)):
    return ok(settings.update_app_settings(session, payload))
