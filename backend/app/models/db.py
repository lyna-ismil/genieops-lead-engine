from __future__ import annotations
from datetime import datetime
from uuid import uuid4
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, func
from sqlalchemy.types import JSON


def _uuid() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    email: str = Field(index=True, unique=True)
    name: str | None = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    name: str
    status: str = Field(default="draft", index=True)

    icp_role: str
    icp_industry: str
    icp_company_size: str = ""
    icp_pain_points: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    icp_goals: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[float] = None

    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class LeadMagnet(SQLModel, table=True):
    __tablename__ = "lead_magnets"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaigns.id", index=True)
    title: str
    type: str
    pain_point_alignment: str
    value_promise: str
    conversion_score: float
    format_recommendation: str
    is_selected: bool = Field(default=True)
    idea_payload: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class Asset(SQLModel, table=True):
    __tablename__ = "assets"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    lead_magnet_id: str = Field(foreign_key="lead_magnets.id", index=True)
    type: str
    content_text: Optional[str] = None
    content_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class LandingPage(SQLModel, table=True):
    __tablename__ = "landing_pages"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    lead_magnet_id: str = Field(foreign_key="lead_magnets.id", index=True)
    slug: str = Field(index=True, unique=True)
    headline: str
    subheadline: str
    bullets: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    cta: str
    html_content: str
    sections: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    form_schema: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    image_url: Optional[str] = None
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class NurtureSequence(SQLModel, table=True):
    __tablename__ = "nurture_sequences"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaigns.id", index=True)
    lead_magnet_id: Optional[str] = Field(default=None, foreign_key="lead_magnets.id", index=True)
    name: str = "Default Sequence"
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class NurtureStep(SQLModel, table=True):
    __tablename__ = "nurture_steps"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    sequence_id: str = Field(foreign_key="nurture_sequences.id", index=True)
    order: int = Field(index=True)
    subject: str
    body: str
    offset_days: int = 0
    intent: Optional[str] = None
    type: str = "regular"
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class Lead(SQLModel, table=True):
    __tablename__ = "leads"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    campaign_id: Optional[str] = Field(default=None, foreign_key="campaigns.id", index=True)
    lead_magnet_id: Optional[str] = Field(default=None, foreign_key="lead_magnets.id", index=True)
    landing_page_id: Optional[str] = Field(default=None, foreign_key="landing_pages.id", index=True)
    email: str = Field(index=True)
    name: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class EmailLog(SQLModel, table=True):
    __tablename__ = "email_logs"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    lead_id: str = Field(foreign_key="leads.id", index=True)
    sequence_id: Optional[str] = Field(default=None, foreign_key="nurture_sequences.id", index=True)
    step_id: Optional[str] = Field(default=None, foreign_key="nurture_steps.id", index=True)
    subject: str
    body: str
    status: str
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class EmailTemplate(SQLModel, table=True):
    __tablename__ = "email_templates"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    name: str
    subject: str
    body: str
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )


class AppSetting(SQLModel, table=True):
    __tablename__ = "app_settings"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    llm_provider: str
    llm_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    llm_temperature: Optional[float] = None
    llm_max_tokens: Optional[int] = None
    email_provider: str
    email_api_key: Optional[str] = None
    email_from: Optional[str] = None
    email_from_name: Optional[str] = None
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
