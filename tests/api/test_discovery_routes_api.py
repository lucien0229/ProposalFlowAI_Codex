from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_discovery_route_contract_layer_declares_the_public_discovery_surface() -> None:
    shared_types = read_text("packages/shared-types/index.ts")
    shared_schemas = read_text("packages/shared-schemas/index.ts")
    shared_config = read_text("packages/shared-config/index.ts")

    expected_type_exports = [
        "DiscoverySourceNote",
        "DiscoverySourceNotes",
        "DiscoveryFieldState",
        "DiscoveryFieldKey",
        "DiscoveryFieldValue",
        "DiscoveryFields",
        "DiscoveryCurrentResource",
        "DiscoveryVersion",
        "DiscoveryCurrentResourceResponse",
        "DiscoveryVersionListResponse",
        "DiscoveryVersionDetailResponse",
        "DiscoverySaveCurrentRequest",
        "DiscoverySaveVersionRequest",
        "DiscoveryRestoreRequest",
        "DiscoveryConflictResponse",
        "DiscoveryGenerateResponse",
        "DiscoverySourceNotesRequest",
    ]
    expected_schema_exports = [
        "discoverySourceNoteSchema",
        "discoverySourceNotesSchema",
        "discoveryFieldStateSchema",
        "discoveryFieldKeySchema",
        "discoveryFieldValueSchema",
        "discoveryFieldsSchema",
        "discoveryCurrentResourceSchema",
        "discoveryVersionSchema",
        "discoveryCurrentResourceResponseSchema",
        "discoveryVersionListResponseSchema",
        "discoveryVersionDetailResponseSchema",
        "discoverySaveCurrentRequestSchema",
        "discoverySaveVersionRequestSchema",
        "discoveryRestoreRequestSchema",
        "discoveryConflictResponseSchema",
        "discoveryGenerateResponseSchema",
        "discoverySourceNotesRequestSchema",
    ]
    expected_route_fragments = [
        'discovery: "discovery"',
        "buildDiscoveryApiPath",
        "buildDiscoveryGenerateApiPath",
        "buildDiscoverySaveVersionApiPath",
        "buildDiscoveryVersionsApiPath",
        "buildDiscoveryVersionDetailApiPath",
        "buildDiscoveryVersionRestoreApiPath",
        "GET /api/v1/opportunities/{opportunity_id}/discovery",
        "PATCH /api/v1/opportunities/{opportunity_id}/discovery",
        "POST /api/v1/opportunities/{opportunity_id}/discovery/generate",
        "POST /api/v1/opportunities/{opportunity_id}/discovery/save-version",
        "GET /api/v1/opportunities/{opportunity_id}/discovery/versions",
        "GET /api/v1/opportunities/{opportunity_id}/discovery/versions/{version_no}",
        "POST /api/v1/opportunities/{opportunity_id}/discovery/versions/{version_no}/restore",
    ]

    for export_name in expected_type_exports:
        assert export_name in shared_types

    for export_name in expected_schema_exports:
        assert export_name in shared_schemas

    for route_fragment in expected_route_fragments:
        assert route_fragment in shared_config
