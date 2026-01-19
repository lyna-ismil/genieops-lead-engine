from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional
import httpx
from sqlmodel import Session, select
from app.models.db import (
    Lead as LeadDB,
    Campaign as CampaignDB,
    LeadMagnet as LeadMagnetDB,
    NurtureSequence as NurtureSequenceDB,
    NurtureStep as NurtureStepDB,
    EmailLog as EmailLogDB,
)
from app.models.schemas import Lead
from app.services.settings import get_app_settings


def render_email(body: str, lead: LeadDB, campaign: Optional[CampaignDB], lead_magnet: Optional[LeadMagnetDB]) -> str:
    rendered = body
    rendered = rendered.replace("{{name}}", lead.name or "there")
    rendered = rendered.replace("{{company}}", lead.company or "")
    rendered = rendered.replace("{{lead_magnet_title}}", lead_magnet.title if lead_magnet else "")
    rendered = rendered.replace("{{campaign_name}}", campaign.name if campaign else "")

    if "{{unsubscribe_url}}" not in rendered:
        rendered += "\n\n---\nUnsubscribe: {{unsubscribe_url}}"
    return rendered


def enqueue_sequence_for_lead(session: Session, lead: LeadDB) -> None:
    seq = None
    if lead.lead_magnet_id:
        seq = session.exec(
            select(NurtureSequenceDB).where(NurtureSequenceDB.lead_magnet_id == lead.lead_magnet_id)
        ).first()
    if not seq and lead.campaign_id:
        seq = session.exec(
            select(NurtureSequenceDB).where(NurtureSequenceDB.campaign_id == lead.campaign_id)
        ).first()
    if not seq:
        return

    steps = session.exec(
        select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)
    ).all()
    now = datetime.utcnow()
    for step in steps:
        scheduled = now + timedelta(days=step.offset_days)
        log = EmailLogDB(
            lead_id=lead.id,
            sequence_id=seq.id,
            step_id=step.id,
            subject=step.subject,
            body=step.body,
            status="queued",
            scheduled_at=scheduled,
        )
        session.add(log)
    session.commit()


async def send_email(session: Session, log: EmailLogDB) -> tuple[bool, Optional[str], Optional[str]]:
    settings = get_app_settings(session)
    if not settings.email_provider or settings.email_provider == "none":
        return True, None, None

    lead = session.get(LeadDB, log.lead_id)
    if not lead:
        return False, None, "Lead not found"
    campaign = session.get(CampaignDB, lead.campaign_id) if lead.campaign_id else None
    lead_magnet = session.get(LeadMagnetDB, lead.lead_magnet_id) if lead.lead_magnet_id else None

    subject = render_email(log.subject, lead, campaign, lead_magnet)
    body = render_email(log.body, lead, campaign, lead_magnet)

    if settings.email_provider.lower() == "sendgrid":
        return await _send_sendgrid(settings, lead.email, subject, body)

    return False, None, "Unsupported email provider"


async def _send_sendgrid(settings, to_email: str, subject: str, body: str) -> tuple[bool, Optional[str], Optional[str]]:
    if not settings.email_api_key:
        return False, None, "Missing email API key"
    payload = {
        "personalizations": [{"to": [{"email": to_email}], "subject": subject}],
        "from": {"email": settings.email_from or "no-reply@genieops.ai", "name": settings.email_from_name or "GenieOps"},
        "content": [{"type": "text/plain", "value": body}],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {settings.email_api_key}"},
            json=payload,
        )
    if response.status_code in (200, 202):
        return True, response.headers.get("X-Message-Id"), None
    return False, None, response.text