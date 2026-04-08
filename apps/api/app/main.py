from fastapi import FastAPI

from app import metadata
from app.admin import router as admin_router
from app.product import router as product_router

API_V1_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    app = FastAPI(
        title="ProposalFlow AI API",
        version="0.1.0",
    )

    app.state.metadata = metadata

    @app.get("/health")
    def health() -> dict[str, str]:
        return {
            "service": "api",
            "status": "ok",
        }

    @app.get("/ready")
    def ready() -> dict[str, str]:
        return {
            "service": "api",
            "status": "ready",
        }

    app.include_router(product_router, prefix=API_V1_PREFIX)
    app.include_router(admin_router, prefix=f"{API_V1_PREFIX}/admin")
    return app


app = create_app()


def run() -> None:
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
