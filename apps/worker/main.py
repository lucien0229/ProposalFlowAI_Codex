from __future__ import annotations

import sys
import time
from pathlib import Path


def _bootstrap_api_path() -> None:
    api_root = Path(__file__).resolve().parents[1] / "api"
    api_root_text = str(api_root)
    if api_root_text not in sys.path:
        sys.path.insert(0, api_root_text)


_bootstrap_api_path()

from app.db import get_engine
from app.file_processing_runtime import ObjectStore, resolve_object_store
from app.opportunity_repository import list_pending_file_processing_jobs
from app.opportunity_service import process_file_upload


def _drain_pending_jobs(object_store: ObjectStore) -> int:
    processed = 0
    with get_engine().begin() as connection:
        jobs = list_pending_file_processing_jobs(connection, limit=25)
        for job in jobs:
            result = process_file_upload(
                connection,
                workspace_id=job["workspace_id"],
                opportunity_id=job["opportunity_id"],
                file_asset_id=job["file_asset_id"],
                object_store=object_store,
            )
            if result is not None:
                processed += 1
    return processed


def main() -> int:
    import os

    object_store = resolve_object_store()
    poll_interval = float(os.environ.get("WORKER_POLL_INTERVAL_SECONDS", "1.5"))
    run_once = os.environ.get("WORKER_RUN_ONCE") == "1"

    if run_once:
        return 0 if _drain_pending_jobs(object_store) >= 0 else 1

    print("ProposalFlow AI worker is running and polling file processing jobs.")
    while True:
        processed = _drain_pending_jobs(object_store)
        if processed == 0:
            time.sleep(poll_interval)


if __name__ == "__main__":
    raise SystemExit(main())
