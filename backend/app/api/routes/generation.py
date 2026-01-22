from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.services import generation
from app.db.session import get_session

router = APIRouter()


@router.post("/campaigns/{campaign_id}/ideate", response_model=None)
async def ideate_campaign(campaign_id: str, session: Session = Depends(get_session)):
    from app.services.projects import get_project
    from app.services.llm_service import LLMClient, ideate_lead_magnets
    from app.core.config import get_settings
    
    project = get_project(session, campaign_id)
    if not project:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    settings = get_settings()
    client = LLMClient(settings)
    
    # Use the project's ICP
    ideas = await ideate_lead_magnets(
        client, 
        project.icp, 
        product_context=project.product_context,
        offer_type=project.offer_type,
        brand_voice=project.brand_voice
    )
    return ok(ideas)


from app.models.schemas import LinkedInParseRequest, WebsiteAnalyzeRequest
from app.services import linkedin
from app.core.config import get_settings
from app.services.llm_service import LLMClient
from app.services.scraper import extract_brand_context
import httpx
from app.services.llm_service import LLMProviderError

@router.post("/parse-linkedin", response_model=None)
async def parse_linkedin_post(payload: LinkedInParseRequest):
    settings = get_settings()
    llm_client = LLMClient(settings)
    icp = await linkedin.extract_post_context(payload.content, llm_client)
    return ok(icp)


@router.post("/analyze-website", response_model=None)
async def analyze_website(payload: WebsiteAnalyzeRequest):
    settings = get_settings()
    llm_client = LLMClient(settings)
    try:
        data = await extract_brand_context(payload.url, llm_client)
        return ok(data)
    except LLMProviderError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"provider": exc.provider, "message": str(exc), "details": exc.details},
        )
    except httpx.HTTPStatusError as exc:
        if exc.response is not None and exc.response.status_code == 401:
            raise HTTPException(
                status_code=502,
                detail="LLM API unauthorized. Check LLM_API_KEY in .env.",
            )
        raise HTTPException(status_code=502, detail=f"LLM provider error: {exc}")

@router.post("/lead-magnets/{lead_magnet_id}/generate", response_model=None)
async def generate_for_lead_magnet(lead_magnet_id: str, session: Session = Depends(get_session)):
    # This legacy route is replaced by /api/llm/asset and /api/llm/landing-page
    # Returning 410 Gone or redirecting to new flow logic if needed.
    # For now, let's just error properly rather than returning mock data.
    raise HTTPException(status_code=410, detail="This endpoint is deprecated. Use /api/llm/asset")
