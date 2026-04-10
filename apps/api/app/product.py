from fastapi import APIRouter, Depends

from app.auth_routes import router as auth_router
from app.opportunity_file_routes import router as opportunity_file_router
from app.opportunity_input_routes import router as opportunity_input_router
from app.opportunity_routes import router as opportunity_router
from app.workspace_routes import router as workspace_router
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


router.include_router(opportunity_router)
router.include_router(opportunity_input_router)
router.include_router(opportunity_file_router)
router.include_router(auth_router)
router.include_router(workspace_router)
