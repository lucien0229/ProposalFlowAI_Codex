from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class InlineJob:
    id: str
    fn_name: str
    args: tuple[Any, ...]
    kwargs: dict[str, Any]
    status: str = "pending"
    result: Any = None
    error: Exception | None = None


class InlineQueue:
    def __init__(self) -> None:
        self.enqueued_jobs: list[InlineJob] = []

    def enqueue(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> InlineJob:
        job = InlineJob(
            id=f"inline-job-{len(self.enqueued_jobs) + 1}",
            fn_name=getattr(fn, "__name__", "anonymous"),
            args=args,
            kwargs=kwargs,
        )
        self.enqueued_jobs.append(job)
        job.status = "processing"

        try:
            job.result = fn(*args, **kwargs)
        except Exception as error:  # pragma: no cover - kept for future task failures
            job.status = "failed"
            job.error = error
            raise

        job.status = "ready"
        return job


class InMemoryObjectStore:
    def __init__(self) -> None:
        self._objects: dict[str, bytes] = {}

    def put_bytes(self, key: str, payload: bytes) -> None:
        self._objects[key] = payload

    def put_text(self, key: str, payload: str, encoding: str = "utf-8") -> None:
        self.put_bytes(key, payload.encode(encoding))

    def get_bytes(self, key: str) -> bytes:
        return self._objects[key]

    def get_text(self, key: str, encoding: str = "utf-8") -> str:
        return self.get_bytes(key).decode(encoding)

    def exists(self, key: str) -> bool:
        return key in self._objects
