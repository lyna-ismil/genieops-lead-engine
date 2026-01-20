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
    PersonaSummaryRequest,
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
    generate_persona_summary,
)

router = APIRouter()


def _client(session: Session) -> LLMClient:
    cfg = settings_service.get_app_settings(session)
    return LLMClient(cfg)


@router.post("/ideate", response_model=None)
async def ideate(payload: IdeationRequest, session: Session = Depends(get_session)):
    client = _client(session)
    try:
        ideas = await ideate_lead_magnets(
            client, 
            payload.icp, 
            offer_type=payload.offer_type, 
            brand_voice=payload.brand_voice, 
            target_conversion=payload.target_conversion
        )
        return ok(ideas)
    except Exception as e:
        from fastapi import HTTPException
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/asset", response_model=None)
async def asset(payload: AssetRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_asset(
        client, 
        payload.idea, 
        payload.icp, 
        offer_type=payload.offer_type, 
        brand_voice=payload.brand_voice
    )
    return ok(result)


@router.post("/landing-page", response_model=None)
async def landing_page(payload: LandingPageRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_landing_page(
        client, 
        payload.idea, 
        payload.asset, 
        payload.image_url,
        offer_type=payload.offer_type,
        brand_voice=payload.brand_voice,
        target_conversion=payload.target_conversion
    )
    return ok(result)


@router.post("/thank-you", response_model=None)
async def thank_you(payload: ThankYouRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_thank_you_page(client, payload.idea)
    return ok(result)


@router.post("/nurture-sequence", response_model=None)
async def nurture(payload: NurtureRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_nurture_sequence(
        client, 
        payload.idea,
        brand_voice=payload.brand_voice,
        target_conversion=payload.target_conversion
    )
    return ok(result)


@router.post("/upgrade-offer", response_model=None)
async def upgrade(payload: UpgradeOfferRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_upgrade_offer(client, payload.idea, payload.emails)
    return ok(result)


@router.post("/linkedin-post", response_model=None)
async def linkedin(payload: LinkedInRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_linkedin_post(
        client, 
        payload.idea, 
        payload.landing_page,
        brand_voice=payload.brand_voice
    )
    return ok({"text": result})


@router.post("/hero-image", response_model=None)
async def hero_image(payload: HeroImageRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_hero_image(
        client, 
        payload.idea, 
        payload.icp,
        brand_voice=payload.brand_voice,
        offer_type=payload.offer_type
    )
    return ok({"url": result})


@router.post("/persona-summary", response_model=None)
async def persona_summary(payload: PersonaSummaryRequest, session: Session = Depends(get_session)):
    client = _client(session)
    result = await generate_persona_summary(client, payload.icp)
    return ok(result)
