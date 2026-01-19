from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import add_exception_handlers
from app.services.email_scheduler import build_scheduler


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="GenieOps Lead Engine API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)
    add_exception_handlers(app)

    scheduler = build_scheduler()

    @app.on_event("startup")
    async def _start_scheduler():
        if not scheduler.running:
            scheduler.start()

    @app.on_event("shutdown")
    async def _stop_scheduler():
        if scheduler.running:
            scheduler.shutdown()

    return app


app = create_app()
