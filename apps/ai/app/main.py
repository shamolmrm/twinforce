import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator

from .core.config import get_settings
from .routers import twin, rag, meeting, embeddings, email_intel
from .services.rag_engine import ensure_collection

import structlog
import logging

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting TwinForce AI Service", version="1.0.0")

    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1)
        logger.info("Sentry initialized")

    try:
        await ensure_collection()
        logger.info("Qdrant collection ready")
    except Exception as e:
        logger.warning("Qdrant not available at startup", error=str(e))

    yield

    logger.info("AI Service shutting down")


settings = get_settings()

app = FastAPI(
    title="TwinForce AI Service",
    description="Enterprise AI backend powering digital twins, RAG, meeting intelligence, and email AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Prometheus ───────────────────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(twin.router)
app.include_router(rag.router)
app.include_router(meeting.router)
app.include_router(embeddings.router)
app.include_router(email_intel.router)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "twinforce-ai",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    return {"message": "TwinForce AI Service", "docs": "/docs"}


# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc), path=str(request.url))
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
