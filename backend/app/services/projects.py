from __future__ import annotations
import re
from typing import Optional
from sqlmodel import Session, select
from sqlalchemy import inspect, text
from app.models.db import (
    Campaign as CampaignDB,
    LeadMagnet as LeadMagnetDB,
    Asset as AssetDB,
    LandingPage as LandingPageDB,
    NurtureSequence as NurtureSequenceDB,
    NurtureStep as NurtureStepDB,
    Lead as LeadDB,
    EmailLog as EmailLogDB,
)
from app.models.schemas import (
    Asset,
    Email,
    EmailSequence,
    ICPProfile,
    LandingPage,
    LeadMagnet,
    OfferStack,
    ProjectCreate,
    ProjectUpdate,
    ProjectView,
    ProductContext,
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
        background_style=getattr(item, "background_style", None),
        theme=getattr(item, "theme", None),
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


def _parse_offset_days(value: str | int | float | None) -> int:
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return max(0, int(value))
    text = str(value).strip()
    if not text:
        return 0
    if "immediate" in text.lower():
        return 0
    match = re.search(r"(\d+)", text)
    if match:
        return max(0, int(match.group(1)))
    return 0


def _dump_model_list(items: Optional[list]) -> list:
    if not items:
        return []
    dumped: list = []
    for item in items:
        if hasattr(item, "model_dump"):
            dumped.append(item.model_dump())
        elif isinstance(item, dict):
            dumped.append(item)
        else:
            dumped.append(item)
    return dumped


def _ensure_campaigns_strategy_summary_column(session: Session) -> None:
    """Ensure the campaigns.strategy_summary column exists (safety net for missing migrations)."""
    try:
        inspector = inspect(session.get_bind())
        columns = {col.get("name") for col in inspector.get_columns("campaigns")}
        if "strategy_summary" in columns:
            return
        session.exec(text("ALTER TABLE campaigns ADD COLUMN strategy_summary JSON"))
        session.commit()
    except Exception:
        session.rollback()


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

    upgrade = None
    if campaign.upgrade_offer:
        try:
            upgrade = OfferStack(**campaign.upgrade_offer)
        except Exception:
            upgrade = OfferStack(
                core_offer=campaign.upgrade_offer.get("core_offer")
                or campaign.upgrade_offer.get("coreOffer")
                or campaign.upgrade_offer.get("positioning", ""),
                price=campaign.upgrade_offer.get("price", ""),
                value_anchor=campaign.upgrade_offer.get("value_anchor")
                or campaign.upgrade_offer.get("valueAnchor", ""),
                guarantee=campaign.upgrade_offer.get("guarantee", ""),
                bonuses=campaign.upgrade_offer.get("bonuses", []),
            )

    return ProjectView(
        id=campaign.id,
        name=campaign.name,
        created_at=campaign.created_at,
        status=campaign.status,
        icp=_campaign_to_icp(campaign),
        offer_type=campaign.offer_type,
        brand_voice=campaign.brand_voice,
        target_conversion=campaign.target_conversion,
        strategy_summary=getattr(campaign, "strategy_summary", None),
        selected_idea=_lead_magnet_to_schema(selected) if selected else None,
        asset=_asset_to_schema(asset) if asset else None,
        landing_page=_landing_to_schema(landing) if landing else None,
        email_sequence=_sequence_to_schema(seq, steps) if seq else None,
        linked_in_post=campaign.linked_in_post,
        upgrade_offer=upgrade,
        product_context=ProductContext(**campaign.product_context) if campaign.product_context else None,
    )


def _resolve_lead_magnet_id(session: Session, campaign_id: str, lead_magnet_id: Optional[str]) -> Optional[str]:
    if lead_magnet_id:
        existing = session.get(LeadMagnetDB, lead_magnet_id)
        if existing:
            return existing.id
    selected = session.exec(
        select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign_id, LeadMagnetDB.is_selected == True)
    ).first()
    if selected:
        return selected.id
    any_lm = session.exec(
        select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign_id)
    ).first()
    return any_lm.id if any_lm else None


def list_projects(session: Session) -> list[ProjectView]:
    _ensure_campaigns_strategy_summary_column(session)
    campaigns = session.exec(select(CampaignDB)).all()
    return [_build_project(session, c) for c in campaigns]


def get_project(session: Session, campaign_id: str) -> Optional[ProjectView]:
    _ensure_campaigns_strategy_summary_column(session)
    campaign = session.get(CampaignDB, campaign_id)
    if not campaign:
        return None
    return _build_project(session, campaign)


def create_project(session: Session, payload: ProjectCreate) -> ProjectView:
    _ensure_campaigns_strategy_summary_column(session)
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
        strategy_summary=getattr(payload, "strategy_summary", None),
        linked_in_post=payload.linked_in_post,
        upgrade_offer=payload.upgrade_offer.model_dump() if payload.upgrade_offer else None,
        product_context=payload.product_context.model_dump() if payload.product_context else None,
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
            strategy_summary=getattr(payload.selected_idea, "strategy_summary", None),
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
                background_style=payload.landing_page.background_style or "plain_white",
                theme=(payload.landing_page.theme or "light"),
                sections=payload.landing_page.sections,
                form_schema=payload.landing_page.form_schema,
            )
            session.add(landing)
        session.commit()

    if payload.email_sequence:
        lead_magnet_id = None
        if payload.selected_idea:
            lead_magnet_id = session.exec(
                select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign.id, LeadMagnetDB.is_selected == True)
            ).first()
            lead_magnet_id = lead_magnet_id.id if lead_magnet_id else None
        if not lead_magnet_id:
            lead_magnet_id = _resolve_lead_magnet_id(session, campaign.id, payload.email_sequence.lead_magnet_id)
        seq = NurtureSequenceDB(
            campaign_id=campaign.id,
            lead_magnet_id=lead_magnet_id,
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
    _ensure_campaigns_strategy_summary_column(session)
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
        if key == "strategy_summary":
            setattr(campaign, "strategy_summary", value)
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
            existing.strategy_summary = getattr(payload.selected_idea, "strategy_summary", None)
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
                    strategy_summary=getattr(payload.selected_idea, "strategy_summary", None),
                )
            )
        session.commit()

    if payload.asset is not None:
        resolved_lead_magnet_id = _resolve_lead_magnet_id(session, campaign.id, payload.asset.lead_magnet_id)
        if resolved_lead_magnet_id:
            existing_asset = session.exec(
                select(AssetDB).where(AssetDB.lead_magnet_id == resolved_lead_magnet_id)
            ).first()
            if existing_asset:
                existing_asset.type = payload.asset.type
                existing_asset.content_text = payload.asset.content
                existing_asset.content_json = payload.asset.content_json
                session.add(existing_asset)
            else:
                session.add(
                    AssetDB(
                        lead_magnet_id=resolved_lead_magnet_id,
                        type=payload.asset.type,
                        content_text=payload.asset.content,
                        content_json=payload.asset.content_json,
                    )
                )
            session.commit()

    if payload.landing_page is not None:
        resolved_lead_magnet_id = _resolve_lead_magnet_id(session, campaign.id, payload.landing_page.lead_magnet_id)
        if resolved_lead_magnet_id:
            existing_lp = session.exec(
                select(LandingPageDB).where(LandingPageDB.lead_magnet_id == resolved_lead_magnet_id)
            ).first()
            if existing_lp:
                existing_lp.slug = payload.landing_page.slug
                existing_lp.headline = payload.landing_page.headline
                existing_lp.subheadline = payload.landing_page.subheadline
                existing_lp.bullets = payload.landing_page.bullets
                existing_lp.cta = payload.landing_page.cta
                existing_lp.html_content = payload.landing_page.html_content
                existing_lp.image_url = payload.landing_page.image_url
                existing_lp.sections = _dump_model_list(payload.landing_page.sections)
                existing_lp.form_schema = _dump_model_list(payload.landing_page.form_schema)
                existing_lp.background_style = payload.landing_page.background_style or "plain_white"
                existing_lp.theme = payload.landing_page.theme or existing_lp.theme or "light"
                session.add(existing_lp)
            else:
                session.add(
                    LandingPageDB(
                        lead_magnet_id=resolved_lead_magnet_id,
                        slug=payload.landing_page.slug,
                        headline=payload.landing_page.headline,
                        subheadline=payload.landing_page.subheadline,
                        bullets=payload.landing_page.bullets,
                        cta=payload.landing_page.cta,
                        html_content=payload.landing_page.html_content,
                        image_url=payload.landing_page.image_url,
                        sections=_dump_model_list(payload.landing_page.sections),
                        form_schema=_dump_model_list(payload.landing_page.form_schema),
                        background_style=payload.landing_page.background_style or "plain_white",
                        theme=(payload.landing_page.theme or "light"),
                    )
                )
            session.commit()

    if payload.email_sequence is not None:
        resolved_lead_magnet_id = _resolve_lead_magnet_id(
            session, campaign.id, payload.email_sequence.lead_magnet_id
        )
        seq = session.exec(
            select(NurtureSequenceDB).where(NurtureSequenceDB.campaign_id == campaign.id)
        ).first()
        if not seq:
            seq = NurtureSequenceDB(
                campaign_id=campaign.id,
                lead_magnet_id=resolved_lead_magnet_id,
                name="Default Sequence",
            )
            session.add(seq)
            session.commit()
            session.refresh(seq)
        else:
            if resolved_lead_magnet_id:
                seq.lead_magnet_id = resolved_lead_magnet_id
            session.add(seq)
            session.commit()

        existing_steps = session.exec(
            select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)
        ).all()
        for step in existing_steps:
            session.delete(step)
        session.commit()

        for idx, email in enumerate(payload.email_sequence.emails or []):
            step = NurtureStepDB(
                sequence_id=seq.id,
                order=idx + 1,
                subject=email.subject or "",
                body=email.body or "",
                    sections=_dump_model_list(payload.landing_page.sections),
                    form_schema=_dump_model_list(payload.landing_page.form_schema),
                type="regular",
            )
            session.add(step)
        session.commit()

    return _build_project(session, campaign)


def delete_project(session: Session, campaign_id: str) -> bool:
    campaign = session.get(CampaignDB, campaign_id)
    if not campaign:
        return False

    # Delete child records that reference this campaign (and their children)
    leads = session.exec(select(LeadDB).where(LeadDB.campaign_id == campaign.id)).all()
    for lead in leads:
        logs = session.exec(select(EmailLogDB).where(EmailLogDB.lead_id == lead.id)).all()
        for log in logs:
            session.delete(log)
        session.delete(lead)
    session.commit()

    lead_magnets = session.exec(
        select(LeadMagnetDB).where(LeadMagnetDB.campaign_id == campaign.id)
    ).all()
    for lm in lead_magnets:
        assets = session.exec(select(AssetDB).where(AssetDB.lead_magnet_id == lm.id)).all()
        for asset in assets:
            session.delete(asset)
        landing_pages = session.exec(select(LandingPageDB).where(LandingPageDB.lead_magnet_id == lm.id)).all()
        for lp in landing_pages:
            # Double-check leads linked via landing_page_id (in case campaign_id was null)
            lp_leads = session.exec(select(LeadDB).where(LeadDB.landing_page_id == lp.id)).all()
            for lpl in lp_leads:
                lp_logs = session.exec(select(EmailLogDB).where(EmailLogDB.lead_id == lpl.id)).all()
                for log in lp_logs:
                    session.delete(log)
                session.delete(lpl)
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
