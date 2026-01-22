from __future__ import annotations
from datetime import datetime
from enum import Enum
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


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
    why_it_works: Optional[str] = Field(default=None, alias="whyItWorks")
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")
    is_selected: Optional[bool] = None
    idea_payload: Optional[dict] = None


class ICPProfile(BaseModel):
    model_config = {"populate_by_name": True}
    role: str
    industry: str
    company_size: str = Field(default="", alias="companySize")
    pain_points: list[str] = Field(default_factory=list, alias="painPoints")
    goals: list[str] = Field(default_factory=list)


class VoiceProfile(BaseModel):
    model_config = {"populate_by_name": True}
    # short/long
    sentence_length: str = Field(default="", alias="sentenceLength")
    # tech/simple
    jargon_level: str = Field(default="", alias="jargonLevel")
    # clichés found on the site
    banned_words: list[str] = Field(default_factory=list, alias="bannedWords")


class ProductContext(BaseModel):
    model_config = {"populate_by_name": True}
    unique_mechanism: str = Field(default="", alias="uniqueMechanism")
    competitor_contrast: str = Field(default="", alias="competitorContrast")
    company_name: Optional[str] = Field(default=None, alias="companyName")
    product_description: Optional[str] = Field(default=None, alias="productDescription")
    main_benefit: Optional[str] = Field(default=None, alias="mainBenefit")
    website_url: Optional[str] = Field(default=None, alias="websiteUrl")
    tone_guidelines: list[str] = Field(default_factory=list, alias="toneGuidelines")
    primary_color: Optional[str] = Field(default=None, alias="primaryColor")
    font_style: Optional[str] = Field(default=None, alias="fontStyle")
    design_vibe: Optional[str] = Field(default=None, alias="designVibe")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    voice_profile: Optional[VoiceProfile] = Field(default=None, alias="voiceProfile")


class OfferStack(BaseModel):
    model_config = {"populate_by_name": True}
    core_offer: str = Field(alias="coreOffer")
    price: str  # e.g., "$97"
    value_anchor: str = Field(alias="valueAnchor")  # e.g., "$500"
    guarantee: str  # Risk reversal statement
    bonuses: list[str] = Field(default_factory=list)

    @field_validator("bonuses", mode="before")
    @classmethod
    def _normalize_bonuses(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            if "\n" in value:
                parts = value.split("\n")
            else:
                parts = value.split(",")
            return [item.strip() for item in parts if item.strip()]
        return value


class WebsiteAnalyzeRequest(BaseModel):
    url: str


class WebsiteAnalyzeResponse(BaseModel):
    model_config = {"populate_by_name": True}
    company_name: Optional[str] = Field(default=None, alias="companyName")
    product_description: Optional[str] = Field(default=None, alias="productDescription")
    main_benefit: Optional[str] = Field(default=None, alias="mainBenefit")
    unique_mechanism: Optional[str] = Field(default=None, alias="uniqueMechanism")
    competitor_contrast: Optional[str] = Field(default=None, alias="competitorContrast")
    primary_color: Optional[str] = Field(default=None, alias="primaryColor")
    font_style: Optional[str] = Field(default=None, alias="fontStyle")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    design_vibe: Optional[str] = Field(default=None, alias="designVibe")
    voice_profile: Optional[VoiceProfile] = Field(default=None, alias="voiceProfile")


class CampaignBase(BaseModel):
    name: str
    status: CampaignStatus = CampaignStatus.draft
    icp: ICPProfile
    product_context: Optional[ProductContext] = Field(default=None, alias="productContext")
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    icp: Optional[ICPProfile] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")


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
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")


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
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")


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


class SectionItem(BaseModel):
    title: str
    description: str
    icon: Optional[str] = None


class Section(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    body: Optional[str] = None
    items: list[SectionItem] = Field(default_factory=list)
    variant: str = "generic"  # feature, testimonial, faq, hero, generic, bento_grid, split_feature, feature_cards


class FormFieldModel(BaseModel):
    name: str
    label: str
    type: str = "text"
    required: bool = True


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
    background_style: Optional[str] = None
    theme: Optional[str] = None
    sections: list[Section] = Field(default_factory=list)
    form_schema: list[FormFieldModel] = Field(default_factory=list)
    social_proof: list[dict] = Field(default_factory=list)
    faq: list[dict] = Field(default_factory=list)
    created_at: datetime


class LandingPageConfig(BaseModel):
    model_config = {"populate_by_name": True}
    headline: str
    subheadline: str
    bullets: list[str]
    cta: str
    html_content: str = Field(alias="htmlContent")
    image_url: Optional[str] = Field(default=None, alias="imageUrl")
    background_style: Optional[str] = Field(
        default=None,
        alias="backgroundStyle",
        description="The visual background style. Must be one of: 'tech_grid', 'clean_dots', 'soft_aurora', 'plain_white'"
    )
    theme: Optional[str] = Field(default=None, description="Theme mode: 'light' or 'dark'")
    sections: list[Section] = Field(default_factory=list)
    form_schema: list[FormFieldModel] = Field(default_factory=list, alias="formSchema")
    social_proof: list[dict] = Field(default_factory=list, alias="socialProof")
    faq: list[dict] = Field(default_factory=list)
    raw_image_prompt: Optional[str] = Field(default=None, alias="rawImagePrompt")
    calculator_config: Optional[dict] = Field(default=None, alias="calculatorConfig")


class LandingPageCreate(BaseModel):
    lead_magnet_id: str
    slug: str
    headline: str
    subheadline: str
    bullets: list[str]
    cta: str
    html_content: str
    image_url: Optional[str] = None
    background_style: Optional[str] = Field(default=None, alias="backgroundStyle")
    theme: Optional[str] = None
    sections: list[Section] = Field(default_factory=list)
    form_schema: list[FormFieldModel] = Field(default_factory=list)
    social_proof: list[dict] = Field(default_factory=list)
    faq: list[dict] = Field(default_factory=list)
    raw_image_prompt: Optional[str] = None


class IdeationRequest(BaseModel):
    icp: ICPProfile
    product_context: Optional[ProductContext] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None



class AssetRequest(BaseModel):
    idea: LeadMagnetIdea
    icp: ICPProfile
    product_context: Optional[ProductContext] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None



class LandingPageRequest(BaseModel):
    idea: LeadMagnetIdea
    asset: GeneratedAsset
    icp: ICPProfile
    product_context: Optional[ProductContext] = None
    image_url: Optional[str] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None



class ThankYouRequest(BaseModel):
    idea: LeadMagnetIdea


class NurtureRequest(BaseModel):
    idea: LeadMagnetIdea
    asset: Optional[GeneratedAsset] = None
    product_context: Optional[ProductContext] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None



class UpgradeOfferRequest(BaseModel):
    idea: LeadMagnetIdea
    emails: list[dict]
    icp: Optional[ICPProfile] = None
    product_context: Optional[ProductContext] = None
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None


class LinkedInLandingPage(BaseModel):
    model_config = {"populate_by_name": True}
    headline: Optional[str] = None
    bullets: list[str] = Field(default_factory=list)
    cta: Optional[str] = None
    image_url: Optional[str] = Field(default=None, alias="imageUrl")
    slug: Optional[str] = None


class LinkedInRequest(BaseModel):
    idea: LeadMagnetIdea
    landing_page: LinkedInLandingPage
    product_context: Optional[ProductContext] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")
    brand_voice: Optional[str] = None


class LinkedInParseRequest(BaseModel):
    content: str



class HeroImageRequest(BaseModel):
    idea: LeadMagnetIdea
    icp: ICPProfile
    brand_voice: Optional[str] = None
    offer_type: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None


class Email(BaseModel):
    model_config = {"populate_by_name": True}
    id: Optional[str] = None
    subject: Optional[str] = ""
    body: Optional[str] = ""
    delay: Optional[str] = "Immediate"
    intent: Optional[str] = ""

    @field_validator("delay", mode="before")
    @classmethod
    def _normalize_delay(cls, value):
        if value is None:
            return "Immediate"
        if isinstance(value, (int, float)):
            return f"Day {int(value)}"
        text = str(value).strip()
        if not text:
            return "Immediate"
        if "immediate" in text.lower():
            return "Immediate"
        match = re.search(r"(\d+)", text)
        if match:
            return f"Day {int(match.group(1))}"
        return text


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


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class ProjectCreate(BaseModel):
    model_config = {"populate_by_name": True}
    name: str
    status: CampaignStatus = CampaignStatus.draft
    icp: ICPProfile
    product_context: Optional[ProductContext] = Field(default=None, alias="productContext")
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")
    selected_idea: Optional[LeadMagnetBase] = None
    asset: Optional[AssetCreate] = None
    landing_page: Optional[LandingPageCreate] = None
    email_sequence: Optional[EmailSequenceCreate] = None
    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[OfferStack] = None


class ProjectUpdate(BaseModel):
    model_config = {"populate_by_name": True}
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    icp: Optional[ICPProfile] = None
    product_context: Optional[ProductContext] = Field(default=None, alias="productContext")
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")
    selected_idea: Optional[LeadMagnetBase] = None
    asset: Optional[AssetCreate] = None
    landing_page: Optional[LandingPageCreate] = None
    email_sequence: Optional[EmailSequenceCreate] = None
    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[OfferStack] = None


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
    product_context: Optional[ProductContext] = Field(default=None, alias="productContext")
    offer_type: Optional[str] = None
    brand_voice: Optional[str] = None
    target_conversion: Optional[str] = None
    strategy_summary: Optional[dict] = Field(default=None, alias="strategySummary")
    selected_idea: Optional[LeadMagnet] = None
    asset: Optional[Asset] = None
    landing_page: Optional[LandingPage] = None
    email_sequence: Optional[EmailSequence] = None
    linked_in_post: Optional[str] = None
    upgrade_offer: Optional[OfferStack] = None


class PersonaSummary(BaseModel):
    summary: str
    hooks: list[str]


class PersonaSummaryRequest(BaseModel):
    icp: ICPProfile

