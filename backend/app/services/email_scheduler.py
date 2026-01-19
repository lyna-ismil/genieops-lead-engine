from __future__ import annotations
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session
from app.db.session import get_engine
from app.services.email_logs import list_due
from app.services.email_service import send_email


def _process_due() -> None:
    engine = get_engine()
    with Session(engine) as session:
        due = list_due(session, datetime.utcnow())
        for log in due:
            try:
                success, provider_id, error = _send_sync(session, log)
                log.status = "sent" if success else "failed"
                log.provider_message_id = provider_id
                log.error_message = error
                log.sent_at = datetime.utcnow() if success else None
                session.add(log)
                session.commit()
            except Exception as exc:
                log.status = "failed"
                log.error_message = str(exc)
                session.add(log)
                session.commit()


def _send_sync(session: Session, log):
    import asyncio

    return asyncio.run(send_email(session, log))


def build_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(_process_due, "interval", seconds=30, max_instances=1)
    return scheduler