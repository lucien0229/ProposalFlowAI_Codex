from fastapi import APIRouter, Depends

from app.security import SessionContext, require_admin_session

router = APIRouter(tags=["admin"])


@router.get("/status")
def status() -> dict[str, str]:
    return {
        "surface": "admin",
        "state": "ready",
    }


@router.post("/guarded")
def guarded_admin_action(
    session: SessionContext = Depends(require_admin_session),
) -> dict[str, str]:
    return {
        "surface": "admin",
        "guard": "admin-session",
        "session_type": session.session_type,
    }
