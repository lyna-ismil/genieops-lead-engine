from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.db.session import get_session
from app.models.schemas import (
    IdeationRequest,
    AssetRequest,
    LandingPageRequest,
    ThankYouRequest,
    NurtureRequest,
    UpgradeOfferRequest,
    LinkedInRequest,
    HeroImageRequest,
)
from app.services import settings as settings_service
from app.services.llm_service import (
    LLMClient,
    ideate_lead_magnets,
    generate_asset,
    generate_landing_page,
    generate_thank_you_page,
    generate_nurture_sequence,
    generate_upgrade_offer,
    generate_linkedin_post,
    generate_hero_image,
)

router = APIRouter()


def _client(session: Session) -> LLMClient:
    cfg = settings_service.get_app_settings(session)
    return LLMClient(cfg)


@router.post("/ideate", response_model=None)
async def ideate(payload: IdeationRequest, session: Session = Depends(get_session)):
    client = _client(session)
    ideas = await ideate_lead_magnets(client, payload.icp)
    return ok(ideas)


@router.post("/asset", response_model=None)
async def asset(payload: AssetRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_asset(client, payload.idea, payload.icp)
    return ok(result)


@router.post("/landing-page", response_model=None)
async def landing_page(payload: LandingPageRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_landing_page(client, payload.idea, payload.asset, payload.image_url)
    return ok(result)


@router.post("/thank-you", response_model=None)
async def thank_you(payload: ThankYouRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_thank_you_page(client, payload.idea)
    return ok(result)


@router.post("/nurture-sequence", response_model=None)
async def nurture(payload: NurtureRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_nurture_sequence(client, payload.idea)
    return ok(result)


@router.post("/upgrade-offer", response_model=None)
async def upgrade(payload: UpgradeOfferRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_upgrade_offer(client, payload.idea, payload.emails)
    return ok(result)


@router.post("/linkedin-post", response_model=None)
async def linkedin(payload: LinkedInRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_linkedin_post(client, payload.idea, payload.landing_page)
    return ok({"text": result})


@router.post("/hero-image", response_model=None)
async def hero_image(payload: HeroImageRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_hero_image(client, payload.idea, payload.icp)
    return ok({"url": result})
