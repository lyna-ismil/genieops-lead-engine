from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.models.schemas import EmailTemplateCreate, EmailTemplateUpdate
from app.services import email_templates
from app.db.session import get_session

router = APIRouter()


@router.get("", response_model=None)
def list_templates(session: Session = Depends(get_session)):
    return ok(email_templates.list_templates(session))


@router.post("", response_model=None)
def create_template(payload: EmailTemplateCreate, session: Session = Depends(get_session)):
    return ok(email_templates.create_template(session, payload))


@router.get("/{template_id}", response_model=None)
def get_template(template_id: str, session: Session = Depends(get_session)):
    template = email_templates.get_template(session, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    return ok(template)


@router.put("/{template_id}", response_model=None)
def update_template(template_id: str, payload: EmailTemplateUpdate, session: Session = Depends(get_session)):
    updated = email_templates.update_template(session, template_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Email template not found")
    return ok(updated)


@router.delete("/{template_id}", response_model=None)
def delete_template(template_id: str, session: Session = Depends(get_session)):
    if not email_templates.delete_template(session, template_id):
        raise HTTPException(status_code=404, detail="Email template not found")
    return ok({"deleted": True})
