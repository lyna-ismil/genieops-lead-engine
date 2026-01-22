from __future__ import annotations
from datetime import datetime
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from sqlmodel import Session
from app.db.session import get_engine
from app.core.config import get_settings
from app.services.email_logs import list_due
from app.services.email_service import send_email

logger = logging.getLogger(__name__)


def _process_due() -> None:
    engine = get_engine()
    try:
        with Session(engine) as session:
            due = list_due(session, datetime.utcnow())
            if due:
                logger.info(f"Email Scheduler: Found {len(due)} emails to send.")
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
                    logger.error(f"Failed to process email {log.id}: {exc}")
                    log.status = "failed"
                    log.error_message = str(exc)
                    session.add(log)
                    session.commit()
    except Exception as exc:
        logger.error(f"Scheduler connection error: {exc}")
    finally:
        engine.dispose()


def _send_sync(session: Session, log):
    import asyncio

    return asyncio.run(send_email(session, log))


def build_scheduler() -> BackgroundScheduler:
    settings = get_settings()
    jobstores = {
        "default": SQLAlchemyJobStore(url=settings.database_url)
    }
    scheduler = BackgroundScheduler(jobstores=jobstores)
    # Run immediately on startup (catch up on missed jobs), then every 30s
    scheduler.add_job(
        _process_due, 
        "interval", 
        seconds=30, 
        id="email_processor",
        replace_existing=True,
        coalesce=True,
        max_instances=1, 
        next_run_time=datetime.now()
    )
    return scheduler