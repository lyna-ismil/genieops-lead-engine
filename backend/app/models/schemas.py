from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CampaignStatus(str, Enum):
    draft = "draft"
    published = "published"


class LeadMagnetType(str, Enum):
    checklist = "checklist"
    template = "template"
    calculator = "calculator"
    report = "report"
    other = "other"


class LeadMagnetIdea(BaseModel):
    model_config = {"populate_by_name": True}
    id: Optional[str] = None
    title: str
    type: LeadMagnetType
    pain_point_alignment: str = Field(alias="painPointAlignment")
    value_promise: str = Field(alias="valuePromise")
    conversion_score: float = Field(alias="conversionScore")
    format_recommendation: str = Field(alias="formatRecommendation")
    is_selected: Optional[bool] = None
    idea_payload: Optional[dict] = None


class ICPProfile(BaseModel):
    model_config = {"populate_by_name": True}
    role: str
    industry: str
    company_size: str = Field(default="", alias="companySize")
    pain_points: list[str] = Field(default_factory=list, alias="painPoints")
    goals: list[str] = Field(default_factory=list)


class CampaignBase(BaseModel):
    name: str
    status: CampaignStatus = CampaignStatus.draft
    icp: ICPProfile
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[float] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    icp: Optional[ICPProfile] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[float] = None


class Campaign(CampaignBase):
    id: str
    created_at: datetime


class LeadMagnetBase(BaseModel):
    campaign_id: str
    title: str
    type: LeadMagnetType
    pain_point_alignment: str
    value_promise: str
    conversion_score: float
    format_recommendation: str
    is_selected: bool = True
    idea_payload: Optional[dict] = None


class LeadMagnetCreate(LeadMagnetBase):
    pass


class LeadMagnetUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[LeadMagnetType] = None
    pain_point_alignment: Optional[str] = None
    value_promise: Optional[str] = None
    conversion_score: Optional[float] = None
    format_recommendation: Optional[str] = None
    is_selected: Optional[bool] = None
    idea_payload: Optional[dict] = None


class LeadMagnet(LeadMagnetBase):
    id: str
    created_at: datetime


class Asset(BaseModel):
    id: str
    lead_magnet_id: str
    content: str
    type: str
    content_json: Optional[dict] = None
    created_at: datetime


class GeneratedAsset(BaseModel):
    content: str
    type: str
    content_json: Optional[dict] = None


class AssetCreate(BaseModel):
    lead_magnet_id: str
    content: str
    type: str
    content_json: Optional[dict] = None


class LandingPage(BaseModel):
    id: str
    lead_magnet_id: str
    slug: str
    headline: str
    subheadline: str
    bullets: list[str]
    cta: str
    html_content: str
    image_url: Optional[str] = None
    sections: Optional[dict] = None
    form_schema: Optional[dict] = None
    created_at: datetime


class LandingPageConfig(BaseModel):
    model_config = {"populate_by_name": True}
    headline: str
    subheadline: str
    bullets: list[str]
    cta: str
    html_content: str = Field(alias="htmlContent")
    image_url: Optional[str] = Field(default=None, alias="imageUrl")
    sections: Optional[dict] = None
    form_schema: Optional[dict] = Field(default=None, alias="formSchema")


class LandingPageCreate(BaseModel):
    lead_magnet_id: str
    slug: str
    headline: str
    subheadline: str
    bullets: list[str]
    cta: str
    html_content: str
    image_url: Optional[str] = None
    sections: Optional[dict] = None
    form_schema: Optional[dict] = None


class IdeationRequest(BaseModel):
    icp: ICPProfile


class AssetRequest(BaseModel):
    idea: LeadMagnetIdea
    icp: ICPProfile


class LandingPageRequest(BaseModel):
    idea: LeadMagnetIdea
    asset: GeneratedAsset
    image_url: Optional[str] = None


class ThankYouRequest(BaseModel):
    idea: LeadMagnetIdea


class NurtureRequest(BaseModel):
    idea: LeadMagnetIdea


class UpgradeOfferRequest(BaseModel):
    idea: LeadMagnetIdea
    emails: list[Email]


class LinkedInRequest(BaseModel):
    idea: LeadMagnetIdea
    landing_page: LandingPageConfig


class HeroImageRequest(BaseModel):
    idea: LeadMagnetIdea
    icp: ICPProfile


class Email(BaseModel):
    id: str
    subject: str
    body: str
    delay: str
    intent: str


class NurtureSequenceBase(BaseModel):
    campaign_id: str
    lead_magnet_id: Optional[str] = None
    name: str = "Default Sequence"


class NurtureSequenceCreate(NurtureSequenceBase):
    pass


class NurtureSequenceUpdate(BaseModel):
    name: Optional[str] = None
    lead_magnet_id: Optional[str] = None


class NurtureSequence(NurtureSequenceBase):
    id: str
    created_at: datetime


class NurtureStepBase(BaseModel):
    sequence_id: str
    order: int
    subject: str
    body: str
    offset_days: int = 0
    intent: Optional[str] = None
    type: Optional[str] = "regular"


class NurtureStepCreate(NurtureStepBase):
    pass


class NurtureStepUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    offset_days: Optional[int] = None
    intent: Optional[str] = None
    type: Optional[str] = None


class NurtureStep(NurtureStepBase):
    id: str
    created_at: datetime


class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    body: str


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class EmailTemplate(EmailTemplateBase):
    id: str
    created_at: datetime


class EmailSequenceBase(BaseModel):
    lead_magnet_id: str
    emails: list[Email]


class EmailSequenceCreate(EmailSequenceBase):
    pass


class EmailSequenceUpdate(BaseModel):
    emails: Optional[list[Email]] = None


class EmailSequence(EmailSequenceBase):
    id: str
    created_at: datetime


class Lead(BaseModel):
    id: str
    landing_page_id: Optional[str] = None
    campaign_id: Optional[str] = None
    lead_magnet_id: Optional[str] = None
    email: EmailStr
    name: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime


class LeadCreate(BaseModel):
    landing_page_id: Optional[str] = None
    campaign_id: Optional[str] = None
    lead_magnet_id: Optional[str] = None
    email: EmailStr
    name: Optional[str] = None
    company: Optional[str] = None


class EmailLog(BaseModel):
    id: str
    lead_id: str
    sequence_id: Optional[str] = None
    step_id: Optional[str] = None
    subject: str
    body: str
    status: str
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime


class Settings(BaseModel):
    llm_provider: str
    llm_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    llm_temperature: Optional[float] = None
    llm_max_tokens: Optional[int] = None
    email_provider: str
    email_api_key: Optional[str] = None
    email_from: Optional[str] = None
    email_from_name: Optional[str] = None


class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    llm_temperature: Optional[float] = None
    llm_max_tokens: Optional[int] = None
    email_provider: Optional[str] = None
    email_api_key: Optional[str] = None
    email_from: Optional[str] = None
    email_from_name: Optional[str] = None


class ProjectCreate(BaseModel):
    name: str
    status: CampaignStatus = CampaignStatus.draft
    icp: ICPProfile
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[float] = None
    selected_idea: Optional[LeadMagnetBase] = None
    asset: Optional[AssetCreate] = None
    landing_page: Optional[LandingPageCreate] = None
    email_sequence: Optional[EmailSequenceCreate] = None
    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[dict] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    icp: Optional[ICPProfile] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[float] = None
    selected_idea: Optional[LeadMagnetBase] = None
    asset: Optional[AssetCreate] = None
    landing_page: Optional[LandingPageCreate] = None
    email_sequence: Optional[EmailSequenceCreate] = None
    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[dict] = None


class ProjectSummary(BaseModel):
    campaign: Campaign
    lead_magnets: list[LeadMagnet]
    landing_pages: list[LandingPage]
    email_sequences: list[EmailSequence]


class ProjectView(BaseModel):
    id: str
    name: str
    created_at: datetime
    status: CampaignStatus
    icp: ICPProfile
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[float] = None
    selected_idea: Optional[LeadMagnet] = None
    asset: Optional[Asset] = None
    landing_page: Optional[LandingPage] = None
    email_sequence: Optional[EmailSequence] = None
    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[dict] = None
