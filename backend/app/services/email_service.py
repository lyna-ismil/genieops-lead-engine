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


def enqueue_sequence_for_lead(session: Session, lead: LeadDB) -> list[EmailLogDB]:
    seq = None
    # 1. Try exact Lead Magnet match
    if lead.lead_magnet_id:
        seq = session.exec(
            select(NurtureSequenceDB).where(NurtureSequenceDB.lead_magnet_id == lead.lead_magnet_id)
        ).first()

    # 2. Fallback: Try Campaign match
    if not seq and lead.campaign_id:
        seq = session.exec(
            select(NurtureSequenceDB).where(NurtureSequenceDB.campaign_id == lead.campaign_id)
        ).first()

    if not seq:
        print(f"[WARN] No Nurture Sequence found for Lead {lead.id}")
        return []

    steps = session.exec(
        select(NurtureStepDB).where(NurtureStepDB.sequence_id == seq.id)
    ).all()
    now = datetime.utcnow()
    logs: list[EmailLogDB] = []

    for step in steps:
        # Add small buffer to ensure "Day 0" isn't skipped by scheduler timing
        scheduled = now + timedelta(days=step.offset_days)
        if step.offset_days > 0:
            scheduled += timedelta(minutes=5)

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
        logs.append(log)

    session.commit()
    for log in logs:
        session.refresh(log)
    return logs


async def send_email(session: Session, log: EmailLogDB) -> tuple[bool, Optional[str], Optional[str]]:
    settings = get_app_settings(session)
    provider_id: Optional[str] = None
    error_message: Optional[str] = None
    success = False

    try:
        provider = (settings.email_provider or "none").lower()

        # Fallback for development if keys are missing
        if provider == "mailersend" and (
            not settings.email_api_key
            or ("mlsn." in settings.email_api_key and len(settings.email_api_key) < 20)
        ):
            print(f"[MOCK EMAIL] Simulating MailerSend: To={log.lead_id}")
            return True, "mock-id", None
        else:
            lead = session.get(LeadDB, log.lead_id)
            if not lead:
                error_message = "Lead not found"
            else:
                campaign = session.get(CampaignDB, lead.campaign_id) if lead.campaign_id else None
                lead_magnet = session.get(LeadMagnetDB, lead.lead_magnet_id) if lead.lead_magnet_id else None
                subject = render_email(log.subject, lead, campaign, lead_magnet)
                body = render_email(log.body, lead, campaign, lead_magnet)

                if provider == "sendgrid":
                    success, provider_id, error_message = await _send_sendgrid(settings, lead.email, subject, body)
                elif provider == "mailersend":
                    try:
                        success, provider_id, error_message = await _send_mailersend(settings, lead.email, subject, body)
                    except httpx.HTTPError as exc:
                        success = False
                        error_message = f"MailerSend client error: {str(exc)}"
                elif provider == "mock":
                    print(f"[MOCK EMAIL] To: {lead.email} | Subject: {subject}")
                    success = True
                    provider_id = f"mock-id-{datetime.utcnow().timestamp()}"
                elif provider == "none":
                    error_message = "Email provider not configured"
                else:
                    error_message = f"Unsupported email provider: {provider}"
    except Exception as exc:
        print(f"Email Sending Exception: {exc}")
        error_message = str(exc)
        success = False

    log.status = "sent" if success else "failed"
    log.sent_at = datetime.utcnow() if success else None
    log.provider_message_id = provider_id
    log.error_message = error_message
    session.add(log)
    session.commit()
    session.refresh(log)
    return success, provider_id, error_message


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


async def _send_mailersend(settings, to_email: str, subject: str, body: str) -> tuple[bool, Optional[str], Optional[str]]:
    if not settings.email_api_key:
        return False, None, "Missing MailerSend API Key"
    payload = {
        "from": {
            "email": settings.email_from or "no-reply@genieops.ai",
            "name": settings.email_from_name or "GenieOps",
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "text": body,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                "https://api.mailersend.com/v1/email",
                headers={
                    "Authorization": f"Bearer {settings.email_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if response.status_code in (200, 202):
            return True, response.headers.get("X-Message-Id", "sent"), None
        try:
            err_data = response.json()
            err_msg = err_data.get("message") or str(err_data)
        except Exception:
            err_msg = response.text
        return False, None, f"MailerSend {response.status_code}: {err_msg}"
    except httpx.TimeoutException:
        return False, None, "MailerSend connection timed out"
    except Exception as e:
        return False, None, f"MailerSend client error: {str(e)}"