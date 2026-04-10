from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import (
    CSRF_COOKIE,
    WEB_SESSION_COOKIE,
    build_auth_bootstrap,
    sign_in_user,
    sign_up_user,
)
from app.db import get_engine
from app.security import SessionContext, require_web_session

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthSignUpPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    return_url: str | None = None


class AuthSignInPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str = Field(min_length=8)
    return_url: str | None = None


class ForgotPasswordPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    return_url: str | None = None


def _set_session_cookies(response: JSONResponse, *, session_id: str, csrf_secret: str) -> JSONResponse:
    response.set_cookie(
        WEB_SESSION_COOKIE,
        session_id,
        httponly=True,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_secret,
        httponly=False,
        samesite="lax",
        path="/",
    )
    return response


@router.get("/me", response_model=None)
def auth_me(session: SessionContext = Depends(require_web_session)) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        bootstrap = build_auth_bootstrap(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
    if bootstrap is None:
      return JSONResponse(status_code=401, content={"detail": "Missing web session cookie"})
    return bootstrap


@router.post("/sign-up", response_model=None)
def post_sign_up(payload: AuthSignUpPayload, request: Request) -> JSONResponse:
    with get_engine().begin() as connection:
        try:
            result = sign_up_user(
                connection,
                email=payload.email,
                full_name=payload.full_name,
                password=payload.password,
                return_url=payload.return_url,
                session_type="web",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
        except ValueError as error:
            return JSONResponse(status_code=409, content={"detail": str(error)})

    response = JSONResponse(
        status_code=200,
        content={"redirect_to": result["redirect_to"]},
    )
    return _set_session_cookies(response, session_id=result["session_id"], csrf_secret=result["csrf_secret"])


@router.post("/sign-in", response_model=None)
def post_sign_in(payload: AuthSignInPayload, request: Request) -> JSONResponse:
    with get_engine().begin() as connection:
        try:
            result = sign_in_user(
                connection,
                email=payload.email,
                password=payload.password,
                return_url=payload.return_url,
                session_type="web",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
        except PermissionError as error:
            return JSONResponse(status_code=401, content={"detail": str(error)})

    response = JSONResponse(
        status_code=200,
        content={"redirect_to": result["redirect_to"]},
    )
    return _set_session_cookies(response, session_id=result["session_id"], csrf_secret=result["csrf_secret"])


@router.post("/forgot-password", response_model=None)
def post_forgot_password(payload: ForgotPasswordPayload) -> JSONResponse:
    return JSONResponse(
        status_code=200,
        content={
            "message": "If the account exists, a reset link has been sent.",
            "email": payload.email,
        },
    )
