from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.core.responses import ok
from app.models.schemas import ProjectCreate, ProjectUpdate
from app.services import projects
from app.db.session import get_session

router = APIRouter()


@router.get("", response_model=None)
def list_projects(session: Session = Depends(get_session)):
    return ok(projects.list_projects(session))


@router.get("/{project_id}", response_model=None)
def get_project(project_id: str, session: Session = Depends(get_session)):
    project = projects.get_project(session, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ok(project)


@router.post("", response_model=None)
def create_project(payload: ProjectCreate, session: Session = Depends(get_session)):
    return ok(projects.create_project(session, payload))


@router.put("/{project_id}", response_model=None)
def update_project(project_id: str, payload: ProjectUpdate, session: Session = Depends(get_session)):
    updated = projects.update_project(session, project_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return ok(updated)


@router.delete("/{project_id}", response_model=None)
def delete_project(project_id: str, session: Session = Depends(get_session)):
    if not projects.delete_project(session, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return ok({"deleted": True})
