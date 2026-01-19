from __future__ import annotations
from sqlmodel import Session, select
from app.models.db import EmailTemplate as EmailTemplateDB
from app.models.schemas import EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate


def _to_schema(db: EmailTemplateDB) -> EmailTemplate:
    return EmailTemplate(
        id=db.id,
        name=db.name,
        subject=db.subject,
        body=db.body,
        created_at=db.created_at,
    )


def list_templates(session: Session) -> list[EmailTemplate]:
    results = session.exec(select(EmailTemplateDB)).all()
    return [_to_schema(item) for item in results]


def get_template(session: Session, template_id: str) -> EmailTemplate | None:
    item = session.get(EmailTemplateDB, template_id)
    return _to_schema(item) if item else None


def create_template(session: Session, payload: EmailTemplateCreate) -> EmailTemplate:
    db_item = EmailTemplateDB(name=payload.name, subject=payload.subject, body=payload.body)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return _to_schema(db_item)


def update_template(session: Session, template_id: str, payload: EmailTemplateUpdate) -> EmailTemplate | None:
    existing = session.get(EmailTemplateDB, template_id)
    if not existing:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(existing, key, value)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return _to_schema(existing)


def delete_template(session: Session, template_id: str) -> bool:
    existing = session.get(EmailTemplateDB, template_id)
    if not existing:
        return False
    session.delete(existing)
    session.commit()
    return True
