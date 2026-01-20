from __future__ import annotations
from typing import Optional
from sqlmodel import Session, select
from app.models.db import (
    Campaign as CampaignDB,
    LeadMagnet as LeadMagnetDB,
    Asset as AssetDB,
    LandingPage as LandingPageDB,
    NurtureSequence as NurtureSequenceDB,
    NurtureStep as NurtureStepDB,
)
from app.models.schemas import (
    Asset,
    Email,
    EmailSequence,
    ICPProfile,
    LandingPage,
    LeadMagnet,
    ProjectCreate,
    ProjectUpdate,
    ProjectView,
)


def _campaign_to_icp(campaign: CampaignDB) -> ICPProfile:
    return ICPProfile(
        role=campaign.icp_role,
        industry=campaign.icp_industry,
        company_size=campaign.icp_company_size or "",
        pain_points=campaign.icp_pain_points or [],
        goals=campaign.icp_goals or [],
    )


def _lead_magnet_to_schema(item: LeadMagnetDB) -> LeadMagnet:
    return LeadMagnet(
        id=item.id,
        campaign_id=item.campaign_id,
        title=item.title,
        type=item.type,
        pain_point_alignment=item.pain_point_alignment,
        value_promise=item.value_promise,
        conversion_score=item.conversion_score,
        format_recommendation=item.format_recommendation,
        is_selected=item.is_selected,
        idea_payload=item.idea_payload,
        created_at=item.created_at,
    )


def _asset_to_schema(item: AssetDB) -> Asset:
    return Asset(
        id=item.id,
        lead_magnet_id=item.lead_magnet_id,
        content=item.content_text or "",
        type=item.type,
        content_json=item.content_json,
        created_at=item.created_at,
    )


def _landing_to_schema(item: LandingPageDB) -> LandingPage:
    return LandingPage(
        id=item.id,
        lead_magnet_id=item.lead_magnet_id,
        slug=item.slug,
        headline=item.headline,
        subheadline=item.subheadline,
        bullets=item.bullets or [],
        cta=item.cta,
        html_content=item.html_content,
        image_url=item.image_url,
        sections=item.sections,
        form_schema=item.form_schema,
        created_at=item.created_at,
    )


def _sequence_to_schema(seq: NurtureSequenceDB, steps: list[NurtureStepDB]) -> EmailSequence:
    emails = [
        Email(
            id=step.id,
            subject=step.subject,
            body=step.body,
            delay=f"Day {step.offset_days}" if step.offset_days else "Immediate",
            intent=step.intent or "",
        )
        for step in sorted(steps, key=lambda s: s.order)
    ]
    return EmailSequence(
        id=seq.id,
        lead_magnet_id=seq.lead_magnet_id or "",
        emails=emails,
        created_at=seq.created_at,
    )


def _build_project(session: Session, campaign: CampaignDB) -> ProjectView:
    lead_magnets = session.exec(
        select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign.id)
    ).all()
    selected = next((lm for lm in lead_magnets if lm.is_selected), lead_magnets[0] if lead_magnets else None)

    asset = None
    landing = None
    if selected:
        asset = session.exec(
            select(AssetDB).where(AssetDB.lead_magnet_id == selected.id)
        ).first()
        landing = session.exec(
            select(LandingPageDB).where(LandingPageDB.lead_magnet_id == selected.id)
        ).first()

    seq = session.exec(
        select(NurtureSequenceDB).where(NurtureSequenceDB.campaign_id == campaign.id)
    ).first()
    steps = []
    if seq:
        steps = session.exec(
            select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)
        ).all()

    return ProjectView(
        id=campaign.id,
        name=campaign.name,
        created_at=campaign.created_at,
        status=campaign.status,
        icp=_campaign_to_icp(campaign),
        offer_type=campaign.offer_type,
        brand_voice=campaign.brand_voice,
        target_conversion=campaign.target_conversion,
        selected_idea=_lead_magnet_to_schema(selected) if selected else None,
        asset=_asset_to_schema(asset) if asset else None,
        landing_page=_landing_to_schema(landing) if landing else None,
        email_sequence=_sequence_to_schema(seq, steps) if seq else None,
        linked_in_post=campaign.linked_in_post,
        upgrade_offer=campaign.upgrade_offer,
    )


def list_projects(session: Session) -> list[ProjectView]:
    campaigns = session.exec(select(CampaignDB)).all()
    return [_build_project(session, c) for c in campaigns]


def get_project(session: Session, campaign_id: str) -> Optional[ProjectView]:
    campaign = session.get(CampaignDB, campaign_id)
    if not campaign:
        return None
    return _build_project(session, campaign)


def create_project(session: Session, payload: ProjectCreate) -> ProjectView:
    campaign = CampaignDB(
        name=payload.name,
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
        icp_role=payload.icp.role,
        icp_industry=payload.icp.industry,
        icp_company_size=payload.icp.company_size,
        icp_pain_points=payload.icp.pain_points,
        icp_goals=payload.icp.goals,
        offer_type=payload.offer_type,
        brand_voice=payload.brand_voice,
        target_conversion=payload.target_conversion,
        linked_in_post=payload.linked_in_post,
        upgrade_offer=payload.upgrade_offer,
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    if payload.selected_idea:
        lm = LeadMagnetDB(
            campaign_id=campaign.id,
            title=payload.selected_idea.title,
            type=payload.selected_idea.type,
            pain_point_alignment=payload.selected_idea.pain_point_alignment,
            value_promise=payload.selected_idea.value_promise,
            conversion_score=payload.selected_idea.conversion_score,
            format_recommendation=payload.selected_idea.format_recommendation,
            is_selected=True,
            idea_payload=payload.selected_idea.idea_payload,
        )
        session.add(lm)
        session.commit()
        session.refresh(lm)

        if payload.asset:
            asset = AssetDB(
                lead_magnet_id=lm.id,
                type=payload.asset.type,
                content_text=payload.asset.content,
                content_json=payload.asset.content_json or {"content": payload.asset.content, "type": payload.asset.type},
            )
            session.add(asset)
        if payload.landing_page:
            landing = LandingPageDB(
                lead_magnet_id=lm.id,
                slug=payload.landing_page.slug,
                headline=payload.landing_page.headline,
                subheadline=payload.landing_page.subheadline,
                bullets=payload.landing_page.bullets,
                cta=payload.landing_page.cta,
                html_content=payload.landing_page.html_content,
                image_url=payload.landing_page.image_url,
                sections=payload.landing_page.sections,
                form_schema=payload.landing_page.form_schema,
            )
            session.add(landing)
        session.commit()

    if payload.email_sequence:
        seq = NurtureSequenceDB(
            campaign_id=campaign.id,
            lead_magnet_id=payload.email_sequence.lead_magnet_id,
            name="Default Sequence",
        )
        session.add(seq)
        session.commit()
        session.refresh(seq)
        for idx, email in enumerate(payload.email_sequence.emails):
            step = NurtureStepDB(
                sequence_id=seq.id,
                order=idx + 1,
                subject=email.subject,
                body=email.body,
                offset_days=0,
                intent=email.intent,
            )
            session.add(step)
        session.commit()

    return _build_project(session, campaign)


def update_project(session: Session, campaign_id: str, payload: ProjectUpdate) -> Optional[ProjectView]:
    campaign = session.get(CampaignDB, campaign_id)
    if not campaign:
        return None
    data = payload.model_dump(exclude_none=True)
    if "icp" in data:
        icp = data.pop("icp")
        campaign.icp_role = icp.get("role")
        campaign.icp_industry = icp.get("industry")
        campaign.icp_company_size = icp.get("company_size")
        campaign.icp_pain_points = icp.get("pain_points")
        campaign.icp_goals = icp.get("goals")
    for key, value in data.items():
        if key == "status" and hasattr(value, "value"):
            value = value.value
        if key in {"selected_idea", "asset", "landing_page", "email_sequence"}:
            continue
        setattr(campaign, key, value)
    session.add(campaign)
    session.commit()

    if payload.selected_idea:
        existing = session.exec(
            select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign.id)
        ).first()
        if existing:
            existing.title = payload.selected_idea.title
            existing.type = payload.selected_idea.type
            existing.pain_point_alignment = payload.selected_idea.pain_point_alignment
            existing.value_promise = payload.selected_idea.value_promise
            existing.conversion_score = payload.selected_idea.conversion_score
            existing.format_recommendation = payload.selected_idea.format_recommendation
            existing.is_selected = True
            existing.idea_payload = payload.selected_idea.idea_payload
            session.add(existing)
        else:
            session.add(
                LeadMagnetDB(
                    campaign_id=campaign.id,
                    title=payload.selected_idea.title,
                    type=payload.selected_idea.type,
                    pain_point_alignment=payload.selected_idea.pain_point_alignment,
                    value_promise=payload.selected_idea.value_promise,
                    conversion_score=payload.selected_idea.conversion_score,
                    format_recommendation=payload.selected_idea.format_recommendation,
                    is_selected=True,
                    idea_payload=payload.selected_idea.idea_payload,
                )
            )
        session.commit()

    return _build_project(session, campaign)


def delete_project(session: Session, campaign_id: str) -> bool:
    campaign = session.get(CampaignDB, campaign_id)
    if not campaign:
        return False

    lead_magnets = session.exec(
        select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign.id)
    ).all()
    for lm in lead_magnets:
        assets = session.exec(select(AssetDB).where(AssetDB.lead_magnet_id == lm.id)).all()
        for asset in assets:
            session.delete(asset)
        landing_pages = session.exec(select(LandingPageDB).where(LandingPageDB.lead_magnet_id == lm.id)).all()
        for lp in landing_pages:
            session.delete(lp)
        session.delete(lm)

    sequences = session.exec(
        select(NurtureSequenceDB).where(NurtureSequenceDB.campaign_id == campaign.id)
    ).all()
    for seq in sequences:
        steps = session.exec(select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)).all()
        for step in steps:
            session.delete(step)
        session.delete(seq)

    session.delete(campaign)
    session.commit()
    return True
