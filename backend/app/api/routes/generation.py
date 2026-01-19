from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.services import generation
from app.db.session import get_session

router = APIRouter()


@router.post("/campaigns/{campaign_id}/ideate", response_model=None)
def ideate_campaign(campaign_id: str):
    ideas = generation.ideate_for_campaign(campaign_id)
    return ok(ideas)


@router.post("/lead-magnets/{lead_magnet_id}/generate", response_model=None)
def generate_for_lead_magnet(lead_magnet_id: str, session: Session = Depends(get_session)):
    result = generation.generate_asset_and_landing(session, lead_magnet_id)
    if not result:
        raise HTTPException(status_code=404, detail="Lead magnet not found")
    asset, landing = result
    return ok({"asset": asset, "landing_page": landing})
