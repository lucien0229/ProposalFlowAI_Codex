from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import SessionRecord, get_session_record
from app.db import get_engine
from app.discovery_service import (
    DiscoveryConflictError,
    DiscoveryNotFoundError,
    DiscoveryValidationError,
    DiscoveryVersionNotFoundError,
    build_discovery_generation_gate,
    ensure_discovery_current,
    generate_discovery,
    get_discovery_version_detail,
    get_discovery_workspace,
    restore_discovery_version,
    save_current_discovery,
    save_version_discovery,
)
from app.opportunity_repository import get_opportunity
from app.security import SessionContext, require_browser_csrf, require_web_session

router = APIRouter(prefix="/opportunities", tags=["discovery"])


class DiscoverySourceNotePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str
    source_label: str | None = None


class DiscoveryFieldValuePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str | None = None
    state: Literal["confirmed", "inferred", "missing", "needs_review"]
    source_excerpt: str | None = None


class DiscoveryFieldsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    goals: DiscoveryFieldValuePayload
    constraints: DiscoveryFieldValuePayload
    ambiguities: DiscoveryFieldValuePayload
    risk_flags: DiscoveryFieldValuePayload
    follow_up_questions: DiscoveryFieldValuePayload


class DiscoveryFieldsMutationPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    fields: DiscoveryFieldsPayload
    source_notes: list[DiscoverySourceNotePayload] | None = None


class DiscoveryRestorePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    version_no: int = Field(ge=1)


class DiscoveryGeneratePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_notes: list[DiscoverySourceNotePayload] = Field(default_factory=list)


def _session_record(session: SessionContext) -> SessionRecord:
    return SessionRecord(
        session_id=session.session_id,
        user_id=session.user_id,
        csrf_secret="",
        workspace_id=session.workspace_id,
        session_type=session.session_type,
    )


def _not_found_response(
    *,
    code: str,
    message: str,
    opportunity_id: str,
    status_code: int = 404,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": {
                    "opportunity_id": opportunity_id,
                },
                "restriction_reason": None,
            }
        },
    )


def _conflict_response(error: DiscoveryConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "DISCOVERY_CONFLICT",
                "message": str(error),
                "details": {
                    "current_revision_no": error.current_revision_no,
                    "expected_revision_no": error.expected_revision_no,
                    "latest_version_no": error.latest_version_no,
                    "message": str(error),
                    "reload_hint": "Reload the latest discovery before saving or restoring.",
                },
                "restriction_reason": None,
            }
        },
    )


def _validation_response(error: DiscoveryValidationError, opportunity_id: str) -> JSONResponse:
    details: dict[str, Any] = {
        "opportunity_id": opportunity_id,
    }
    if error.field_key is not None:
        details["field_key"] = error.field_key
    if error.state is not None:
        details["state"] = error.state
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(error),
                "details": details,
                "restriction_reason": None,
            }
        },
    )


def _source_notes_payload(source_notes: list[DiscoverySourceNotePayload] | None) -> list[dict[str, Any]] | None:
    if source_notes is None:
        return None
    return [note.model_dump() for note in source_notes]


@router.get("/{opportunity_id}/discovery", response_model=None)
def get_discovery_route(
    opportunity_id: str,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        opportunity = get_opportunity(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
        if opportunity is None:
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        payload = get_discovery_workspace(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
            user_id=loaded_session.user_id,
        )
    return payload


@router.patch("/{opportunity_id}/discovery", response_model=None)
def patch_discovery_route(
    opportunity_id: str,
    payload: DiscoveryFieldsMutationPayload,
    session: SessionContext = Depends(require_browser_csrf),
    ) -> JSONResponse | dict[str, Any]:
    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            result = save_current_discovery(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                expected_revision_no=payload.expected_revision_no,
                fields=payload.fields.model_dump(),
                source_notes=_source_notes_payload(payload.source_notes),
                user_id=loaded_session.user_id,
            )
    except DiscoveryConflictError as error:
        return _conflict_response(error)
    except DiscoveryValidationError as error:
        return _validation_response(error, opportunity_id)
    except DiscoveryNotFoundError:
        return _not_found_response(
            code="DISCOVERY_NOT_FOUND",
            message="Discovery not found.",
            opportunity_id=opportunity_id,
        )
    return result


@router.post("/{opportunity_id}/discovery/save-version", response_model=None)
def save_discovery_version_route(
    opportunity_id: str,
    payload: DiscoveryFieldsMutationPayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            result = save_version_discovery(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                expected_revision_no=payload.expected_revision_no,
                fields=payload.fields.model_dump(),
                source_notes=_source_notes_payload(payload.source_notes),
                user_id=loaded_session.user_id,
            )
    except DiscoveryConflictError as error:
        return _conflict_response(error)
    except DiscoveryValidationError as error:
        return _validation_response(error, opportunity_id)
    except DiscoveryNotFoundError:
        return _not_found_response(
            code="DISCOVERY_NOT_FOUND",
            message="Discovery not found.",
            opportunity_id=opportunity_id,
        )
    return result


@router.get("/{opportunity_id}/discovery/versions", response_model=None)
def list_discovery_versions_route(
    opportunity_id: str,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        opportunity = get_opportunity(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
        if opportunity is None:
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        payload = get_discovery_workspace(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
            user_id=loaded_session.user_id,
        )
    return {"items": payload["versions"]}


@router.get("/{opportunity_id}/discovery/versions/{version_no}", response_model=None)
def get_discovery_version_route(
    opportunity_id: str,
    version_no: int,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            payload = get_discovery_version_detail(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                version_no=version_no,
            )
    except DiscoveryVersionNotFoundError:
        return _not_found_response(
            code="DISCOVERY_VERSION_NOT_FOUND",
            message="Discovery version not found.",
            opportunity_id=opportunity_id,
        )
    return payload


@router.post("/{opportunity_id}/discovery/versions/{version_no}/restore", response_model=None)
def restore_discovery_version_route(
    opportunity_id: str,
    version_no: int,
    payload: DiscoveryRestorePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    if payload.version_no != version_no:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Version number mismatch.",
                    "details": {
                        "opportunity_id": opportunity_id,
                        "version_no": version_no,
                    },
                    "restriction_reason": None,
                }
            },
        )

    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            result = restore_discovery_version(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                version_no=version_no,
                expected_revision_no=payload.expected_revision_no,
                user_id=loaded_session.user_id,
            )
    except DiscoveryConflictError as error:
        return _conflict_response(error)
    except DiscoveryNotFoundError:
        return _not_found_response(
            code="DISCOVERY_NOT_FOUND",
            message="Discovery not found.",
            opportunity_id=opportunity_id,
        )
    except DiscoveryVersionNotFoundError:
        return _not_found_response(
            code="DISCOVERY_VERSION_NOT_FOUND",
            message="Discovery version not found.",
            opportunity_id=opportunity_id,
        )
    return result


@router.post("/{opportunity_id}/discovery/generate", response_model=None)
def generate_discovery_route(
    opportunity_id: str,
    payload: DiscoveryGeneratePayload | None = None,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            ensure_discovery_current(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                user_id=loaded_session.user_id,
            )
            gate = build_discovery_generation_gate(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                source_notes=_source_notes_payload(payload.source_notes) if payload is not None else None,
            )
            if gate["can_generate"]:
                result = generate_discovery(
                    connection,
                    workspace_id=loaded_session.workspace_id or "",
                    opportunity_id=opportunity_id,
                    user_id=loaded_session.user_id,
                    source_notes=_source_notes_payload(payload.source_notes) if payload is not None else None,
                )
            else:
                result = {
                    "opportunity_id": opportunity_id,
                    "redirect_to": f"/opportunities/{opportunity_id}/discovery",
                    "generation_started_at": datetime.now(UTC).isoformat(),
                    "gate": gate,
                }
    except DiscoveryConflictError as error:
        return _conflict_response(error)
    except DiscoveryNotFoundError:
        return _not_found_response(
            code="DISCOVERY_NOT_FOUND",
            message="Discovery not found.",
            opportunity_id=opportunity_id,
        )
    return JSONResponse(status_code=202, content=result)
