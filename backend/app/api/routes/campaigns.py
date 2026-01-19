from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.models.schemas import Campaign, CampaignCreate, CampaignUpdate
from app.services import campaigns
from app.db.session import get_session

router = APIRouter()


@router.get("", response_model=None)
def list_campaigns(session: Session = Depends(get_session)):
    return ok(campaigns.list_campaigns(session))


@router.post("", response_model=None)
def create_campaign(payload: CampaignCreate, session: Session = Depends(get_session)):
    return ok(campaigns.create_campaign(session, payload))


@router.get("/{campaign_id}", response_model=None)
def get_campaign(campaign_id: str, session: Session = Depends(get_session)):
    campaign = campaigns.get_campaign(session, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return ok(campaign)


@router.put("/{campaign_id}", response_model=None)
def update_campaign(campaign_id: str, payload: CampaignUpdate, session: Session = Depends(get_session)):
    updated = campaigns.update_campaign(session, campaign_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return ok(updated)


@router.delete("/{campaign_id}", response_model=None)
def delete_campaign(campaign_id: str, session: Session = Depends(get_session)):
    if not campaigns.delete_campaign(session, campaign_id):
        raise HTTPException(status_code=404, detail="Campaign not found")
    return ok({"deleted": True})
