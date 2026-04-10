from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_lead_brief_contract_layer_declares_the_versioned_resource_surface() -> None:
    shared_types = read_text("packages/shared-types/index.ts")
    shared_schemas = read_text("packages/shared-schemas/index.ts")
    shared_config = read_text("packages/shared-config/index.ts")

    expected_type_exports = [
        "LeadBriefFieldState",
        "LeadBriefFieldValue",
        "LeadBriefCurrentResource",
        "LeadBriefVersion",
        "LeadBriefCurrentResourceResponse",
        "LeadBriefVersionListResponse",
        "LeadBriefVersionDetailResponse",
        "LeadBriefSaveCurrentRequest",
        "LeadBriefSaveVersionRequest",
        "LeadBriefRestoreRequest",
        "LeadBriefConflictResponse",
    ]
    expected_schema_exports = [
        "leadBriefFieldStateSchema",
        "leadBriefFieldValueSchema",
        "leadBriefCurrentResourceSchema",
        "leadBriefVersionSchema",
        "leadBriefCurrentResourceResponseSchema",
        "leadBriefVersionListResponseSchema",
        "leadBriefVersionDetailResponseSchema",
        "leadBriefSaveCurrentRequestSchema",
        "leadBriefSaveVersionRequestSchema",
        "leadBriefRestoreRequestSchema",
        "leadBriefConflictResponseSchema",
    ]
    expected_route_fragments = [
        "lead-brief",
        "OPPORTUNITY_STEP_ROUTE_SEGMENTS",
        "buildOpportunityStepPath",
        "expected_revision_no",
        "current_revision_no",
    ]

    for export_name in expected_type_exports:
        assert export_name in shared_types

    for export_name in expected_schema_exports:
        assert export_name in shared_schemas

    for route_fragment in expected_route_fragments:
        assert route_fragment in shared_config or route_fragment in shared_schemas or route_fragment in shared_types
