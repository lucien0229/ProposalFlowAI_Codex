from __future__ import annotations

import json
from pathlib import Path
import tomllib


ROOT = Path(__file__).resolve().parents[2]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_phase4_wave0_contract_baseline_declares_opportunity_intake_surface() -> None:
    shared_types = read_text("packages/shared-types/index.ts")
    shared_schemas = read_text("packages/shared-schemas/index.ts")
    shared_config = read_text("packages/shared-config/index.ts")

    expected_type_exports = [
        "OpportunityOverviewResponse",
        "OpportunityInput",
        "OpportunityFileAsset",
        "OpportunityFileProcessingJob",
        "LeadBriefGenerateResponse",
    ]
    expected_schema_exports = [
        "opportunityOverviewResponseSchema",
        "opportunityInputsListResponseSchema",
        "createOpportunityInputSchema",
        "updateOpportunityInputSchema",
        "opportunityFileDetailSchema",
        "leadBriefGenerateResponseSchema",
    ]
    expected_route_fragments = [
        "GET /api/v1/opportunities/{opportunity_id}",
        "PATCH /api/v1/opportunities/{opportunity_id}",
        "/opportunities/${opportunityId}/inputs",
        "/opportunities/${opportunityId}/files/upload-url",
        "/opportunities/${opportunityId}/files/${fileAssetId}/complete",
        "/opportunities/${opportunityId}/files/${fileAssetId}",
        "/opportunities/${opportunityId}/files/${fileAssetId}/retry",
        "/opportunities/${opportunityId}/lead-brief/generate",
        "OPPORTUNITY_FILE_POLL_INTERVAL_MS = 2000",
    ]

    for export_name in expected_type_exports:
        assert export_name in shared_types

    for export_name in expected_schema_exports:
        assert export_name in shared_schemas

    for route_fragment in expected_route_fragments:
        assert route_fragment in shared_config


def test_phase4_wave0_dependency_baseline_declares_frontend_and_worker_stack() -> None:
    web_package = json.loads(read_text("apps/web/package.json"))
    root_package = json.loads(read_text("package.json"))
    api_project = tomllib.loads(read_text("apps/api/pyproject.toml"))
    worker_project = tomllib.loads(read_text("apps/worker/pyproject.toml"))

    expected_web_dependencies = {
        "@hookform/resolvers",
        "@tanstack/react-query",
        "lucide-react",
        "react-hook-form",
        "zod",
    }
    expected_python_dependencies = {"boto3", "pypdf", "redis", "rq"}

    assert expected_web_dependencies.issubset(web_package["dependencies"])
    assert "@playwright/test" in root_package["devDependencies"]

    api_dependencies = {
        dependency.split(">=", maxsplit=1)[0]
        for dependency in api_project["project"]["dependencies"]
    }
    worker_dependencies = {
        dependency.split(">=", maxsplit=1)[0]
        for dependency in worker_project["project"]["dependencies"]
    }

    assert expected_python_dependencies.issubset(api_dependencies)
    assert expected_python_dependencies.issubset(worker_dependencies)
