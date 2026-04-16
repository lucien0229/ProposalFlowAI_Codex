from __future__ import annotations

from datetime import UTC
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import SessionRecord, get_session_record
from app.db import get_engine
from app.opportunity_repository import get_opportunity
from app.security import SessionContext, require_browser_csrf, require_web_session
from app.templates_rules_service import (
    OpportunityRuleOverrideConflictError,
    RuleValidationError,
    WorkspaceRulesConflictError,
    clear_opportunity_override_payload,
    get_effective_rules_payload,
    get_opportunity_override_payload,
    get_workspace_rules_payload,
    list_templates_payload,
    update_opportunity_override_payload,
    update_workspace_rules_payload,
    validate_workspace_rule_set_payload,
)

router = APIRouter(tags=["templates-rules"])


class WorkspaceRuleSetPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_key: str
    template_scope: str | None = None
    tone_profile: str
    default_assumptions: list[str] = Field(default_factory=list)
    default_exclusions: list[str] = Field(default_factory=list)
    preferred_terminology: list[str] = Field(default_factory=list)
    banned_terminology: list[str] = Field(default_factory=list)
    service_modules: list[str] = Field(default_factory=list)
    section_order: list[str] = Field(default_factory=list)
    required_sections: list[str] = Field(default_factory=list)
    default_cta_style: str
    updated_at: str | None = None


class WorkspaceRuleSetUpdatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_updated_at: str
    rule_set: WorkspaceRuleSetPayload


class WorkspaceRuleSetValidationPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_set: WorkspaceRuleSetPayload


class OpportunityRuleOverridePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_key_override: str
    tone_profile_override: str
    assumptions_override: list[str] = Field(default_factory=list)
    exclusions_override: list[str] = Field(default_factory=list)
    service_modules_override: list[str] = Field(default_factory=list)
    preferred_terminology_additions: list[str] = Field(default_factory=list)
    banned_terminology_additions: list[str] = Field(default_factory=list)
    default_cta_style_override: str
    updated_at: str | None = None


class OpportunityRuleOverrideUpdatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_updated_at: str
    override: OpportunityRuleOverridePayload


def _session_record(session: SessionContext) -> SessionRecord | None:
    with get_engine().begin() as connection:
        return get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )


def _workspace_not_found_response() -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "WORKSPACE_NOT_FOUND",
                "message": "Workspace not found.",
                "details": {},
                "restriction_reason": None,
            }
        },
    )


def _opportunity_not_found_response(opportunity_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "OPPORTUNITY_NOT_FOUND",
                "message": "Opportunity not found.",
                "details": {
                    "opportunity_id": opportunity_id,
                },
                "restriction_reason": None,
            }
        },
    )


def _rule_validation_response(error: RuleValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": error.code,
                "message": str(error),
                "details": error.details,
                "restriction_reason": None,
            }
        },
    )


def _rule_conflict_response(error: WorkspaceRulesConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "RULE_SET_CONFLICT",
                "message": str(error),
                "details": {
                    "current_updated_at": error.current_updated_at.astimezone(UTC).isoformat().replace("+00:00", "Z"),
                    "expected_updated_at": error.expected_updated_at.astimezone(UTC).isoformat().replace("+00:00", "Z"),
                    "message": str(error),
                    "reload_hint": "Reload the latest workspace rules before saving again.",
                },
                "restriction_reason": None,
            }
        },
    )


def _override_conflict_response(error: OpportunityRuleOverrideConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "RULE_OVERRIDE_CONFLICT",
                "message": str(error),
                "details": {
                    "opportunity_id": error.opportunity_id,
                    "current_updated_at": error.current_updated_at.astimezone(UTC).isoformat().replace("+00:00", "Z"),
                    "expected_updated_at": error.expected_updated_at.astimezone(UTC).isoformat().replace("+00:00", "Z"),
                    "message": str(error),
                    "reload_hint": "Reload the latest opportunity override before saving again.",
                },
                "restriction_reason": None,
            }
        },
    )


@router.get("/templates", response_model=None)
def list_templates_route(
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None:
        return _workspace_not_found_response()
    with get_engine().begin() as connection:
        return list_templates_payload(connection)


@router.get("/workspaces/current/rules", response_model=None)
def get_workspace_rules_route(
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    with get_engine().begin() as connection:
        return get_workspace_rules_payload(
            connection,
            workspace_id=loaded_session.workspace_id,
            updated_by_user_id=loaded_session.user_id,
        )


@router.put("/workspaces/current/rules", response_model=None)
def update_workspace_rules_route(
    payload: WorkspaceRuleSetUpdatePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    try:
        with get_engine().begin() as connection:
            return update_workspace_rules_payload(
                connection,
                workspace_id=loaded_session.workspace_id,
                updated_by_user_id=loaded_session.user_id,
                expected_updated_at=payload.expected_updated_at,
                rule_set=payload.rule_set.model_dump(),
            )
    except RuleValidationError as error:
        return _rule_validation_response(error)
    except WorkspaceRulesConflictError as error:
        return _rule_conflict_response(error)


@router.post("/workspaces/current/rules/validate", response_model=None)
def validate_workspace_rules_route(
    payload: WorkspaceRuleSetValidationPayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    try:
        with get_engine().begin() as connection:
            validate_workspace_rule_set_payload(connection, payload.rule_set.model_dump())
    except RuleValidationError as error:
        return _rule_validation_response(error)
    return {
        "valid": True,
        "summary": {
            "field_errors": [],
            "save_blockers": [],
        },
    }


@router.get("/opportunities/{opportunity_id}/rules/effective", response_model=None)
def get_effective_rules_route(
    opportunity_id: str,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    try:
        with get_engine().begin() as connection:
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _opportunity_not_found_response(opportunity_id)
            return get_effective_rules_payload(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
                updated_by_user_id=loaded_session.user_id,
            )
    except RuleValidationError as error:
        return _rule_validation_response(error)


@router.get("/opportunities/{opportunity_id}/rules/override", response_model=None)
def get_opportunity_override_route(
    opportunity_id: str,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    try:
        with get_engine().begin() as connection:
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _opportunity_not_found_response(opportunity_id)
            return get_opportunity_override_payload(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
                updated_by_user_id=loaded_session.user_id,
            )
    except RuleValidationError as error:
        return _rule_validation_response(error)


@router.put("/opportunities/{opportunity_id}/rules/override", response_model=None)
def update_opportunity_override_route(
    opportunity_id: str,
    payload: OpportunityRuleOverrideUpdatePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    try:
        with get_engine().begin() as connection:
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _opportunity_not_found_response(opportunity_id)
            return update_opportunity_override_payload(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
                updated_by_user_id=loaded_session.user_id,
                expected_updated_at=payload.expected_updated_at,
                override=payload.override.model_dump(),
            )
    except OpportunityRuleOverrideConflictError as error:
        return _override_conflict_response(error)
    except RuleValidationError as error:
        return _rule_validation_response(error)


@router.delete("/opportunities/{opportunity_id}/rules/override", response_model=None)
def clear_opportunity_override_route(
    opportunity_id: str,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    loaded_session = _session_record(session)
    if loaded_session is None or not loaded_session.workspace_id:
        return _workspace_not_found_response()
    try:
        with get_engine().begin() as connection:
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _opportunity_not_found_response(opportunity_id)
            return clear_opportunity_override_payload(
                connection,
                workspace_id=loaded_session.workspace_id,
                opportunity_id=opportunity_id,
                updated_by_user_id=loaded_session.user_id,
            )
    except RuleValidationError as error:
        return _rule_validation_response(error)
