from fastapi import APIRouter, Depends

from app.security import SessionContext, require_browser_csrf

router = APIRouter(tags=["product"])


@router.get("/status")
def status() -> dict[str, str]:
    return {
        "surface": "product",
        "state": "ready",
    }


@router.post("/drafts")
def create_draft(
    session: SessionContext = Depends(require_browser_csrf),
) -> dict[str, str]:
    return {
        "surface": "product",
        "guard": "web-session+csrf",
        "session_type": session.session_type,
    }
