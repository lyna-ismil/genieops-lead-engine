from fastapi import APIRouter
from app.api.routes.campaigns import router as campaigns_router
from app.api.routes.lead_magnets import router as lead_magnets_router
from app.api.routes.generation import router as generation_router
from app.api.routes.email_sequences import router as email_sequences_router
from app.api.routes.email_templates import router as email_templates_router
from app.api.routes.settings import router as settings_router
from app.api.routes.projects import router as projects_router
from app.api.routes.public import router as public_router
from app.api.routes.llm import router as llm_router
from app.api.routes.nurture_steps import router as nurture_steps_router
from app.api.routes.email_logs import router as email_logs_router
from app.api.routes.nurture_sequences import router as nurture_sequences_router
from app.api.routes.social import router as social_router

api_router = APIRouter()

api_router.include_router(campaigns_router, prefix="/api/campaigns", tags=["campaigns"])
api_router.include_router(lead_magnets_router, prefix="/api/lead-magnets", tags=["lead-magnets"])
api_router.include_router(generation_router, prefix="/api/generation", tags=["generation"])
api_router.include_router(email_sequences_router, prefix="/api/email-sequences", tags=["email-sequences"])
api_router.include_router(email_templates_router, prefix="/api/email-templates", tags=["email-templates"])
api_router.include_router(settings_router, prefix="/api/settings", tags=["settings"])
api_router.include_router(projects_router, prefix="/api/projects", tags=["projects"])
api_router.include_router(llm_router, prefix="/api/llm", tags=["llm"])
api_router.include_router(nurture_sequences_router, prefix="/api/nurture-sequences", tags=["nurture-sequences"])
api_router.include_router(nurture_steps_router, prefix="/api/nurture-steps", tags=["nurture-steps"])
api_router.include_router(email_logs_router, prefix="/api/email-logs", tags=["email-logs"])
api_router.include_router(public_router, prefix="/public", tags=["public"])
api_router.include_router(social_router, prefix="/api/social", tags=["social"])
