from fastapi import APIRouter

router = APIRouter(tags=["admin"])


@router.get("/status")
def status() -> dict[str, str]:
    return {
        "surface": "admin",
        "state": "ready",
    }
