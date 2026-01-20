from __future__ import annotations
from sqlmodel import Session, select
from app.models.db import AppSetting
from app.models.schemas import Settings, SettingsUpdate
from app.core.config import get_settings


def _to_schema(db: AppSetting) -> Settings:
    return Settings(
        llm_provider=db.llm_provider,
        llm_api_key=db.llm_api_key,
        llm_model=db.llm_model,
        llm_temperature=db.llm_temperature,
        llm_max_tokens=db.llm_max_tokens,
        email_provider=db.email_provider,
        email_api_key=db.email_api_key,
        email_from=db.email_from,
        email_from_name=db.email_from_name,
    )


def get_app_settings(session: Session) -> Settings:
    existing = session.exec(select(AppSetting).limit(1)).first()
    env = get_settings()
    if existing:
        # Auto-sync if env settings changed (Migration logic)
        if (env.llm_provider and env.llm_provider != existing.llm_provider) or \
           (env.llm_api_key and env.llm_api_key != existing.llm_api_key) or \
           (env.llm_model and env.llm_model != existing.llm_model):
            existing.llm_provider = env.llm_provider
            existing.llm_api_key = env.llm_api_key
            existing.llm_model = env.llm_model
            existing.llm_temperature = env.llm_temperature
            existing.llm_max_tokens = env.llm_max_tokens
            session.add(existing)
            session.commit()
            session.refresh(existing)
        return _to_schema(existing)
    db_item = AppSetting(
        llm_provider=env.llm_provider,
        llm_api_key=env.llm_api_key,
        llm_model=env.llm_model,
        llm_temperature=env.llm_temperature,
        llm_max_tokens=env.llm_max_tokens,
        email_provider=env.email_provider,
        email_api_key=env.email_api_key,
        email_from=env.email_from,
        email_from_name=env.email_from_name,
    )
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return _to_schema(db_item)


def update_app_settings(session: Session, payload: SettingsUpdate) -> Settings:
    existing = session.exec(select(AppSetting).limit(1)).first()
    if not existing:
        existing = AppSetting(
            llm_provider="gemini",
            email_provider="none",
        )
    data = payload.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(existing, key, value)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return _to_schema(existing)
