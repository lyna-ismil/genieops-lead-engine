from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.responses import ok
from app.db.session import get_session
from app.models.schemas import AuthResponse, UserCreate, UserLogin, UserPublic
from app.models.db import User as UserDB
from app.services.auth import create_access_token, get_current_user, get_user_by_email, hash_password, verify_password

router = APIRouter()


@router.post("/signup", response_model=None)
async def signup(payload: UserCreate, session: Session = Depends(get_session)):
    existing = get_user_by_email(session, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = UserDB(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return ok({
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        }
    })


@router.post("/login", response_model=None)
async def login(payload: UserLogin, session: Session = Depends(get_session)):
    user = get_user_by_email(session, payload.email)
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return ok({
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        }
    })


@router.get("/me", response_model=None)
async def me(current: UserDB = Depends(get_current_user)):
    return ok({
        "id": current.id,
        "email": current.email,
        "name": current.name,
    })


@router.post("/logout", response_model=None)
async def logout():
    return ok({"success": True})
