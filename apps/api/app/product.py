from fastapi import APIRouter

router = APIRouter(tags=["product"])


@router.get("/status")
def status() -> dict[str, str]:
    return {
        "surface": "product",
        "state": "ready",
    }
