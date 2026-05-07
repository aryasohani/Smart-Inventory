from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings, get_cors_origins
from app.core.logging import setup_logging, logger
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
    BadRequestException,
)
from app.automation.scheduler import start_scheduler, stop_scheduler
from app.core.middleware import RequestLoggingMiddleware
from app.routers import (
    auth_router,
    products_router,
    suppliers_router,
    po_router,
    ai_router,
    invoices_router,
    reports_router,
)

# -------------------------------
# Lifespan (Startup / Shutdown)
# -------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("SmartStore AI starting up", env=settings.APP_ENV)

    start_scheduler()
    logger.info("All systems online")

    yield

    stop_scheduler()
    logger.info("SmartStore AI shut down")


# -------------------------------
# FastAPI App
# -------------------------------
app = FastAPI(
    title="SmartStore AI — Intelligent Inventory & Vendor Management",
    version="1.0.0",
    lifespan=lifespan,
)


# -------------------------------
# Middleware
# -------------------------------
app.add_middleware(RequestLoggingMiddleware)

# ✅ CLEAN CORS CONFIG (FIXED)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),  # from .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# Exception Handlers
# -------------------------------
@app.exception_handler(NotFoundException)
async def not_found_handler(request: Request, exc: NotFoundException):
    return JSONResponse(status_code=404, content={"detail": exc.detail})


@app.exception_handler(ConflictException)
async def conflict_handler(request: Request, exc: ConflictException):
    return JSONResponse(status_code=409, content={"detail": exc.detail})


@app.exception_handler(ForbiddenException)
async def forbidden_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(status_code=403, content={"detail": exc.detail})


@app.exception_handler(UnauthorizedException)
async def unauthorized_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=401,
        content={"detail": exc.detail},
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.exception_handler(BadRequestException)
async def bad_request_handler(request: Request, exc: BadRequestException):
    return JSONResponse(status_code=400, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        path=str(request.url),
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# -------------------------------
# Routers
# -------------------------------
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(suppliers_router)
app.include_router(po_router)
app.include_router(ai_router)
app.include_router(invoices_router)
app.include_router(reports_router)


# -------------------------------
# Health Routes
# -------------------------------
@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "env": settings.APP_ENV,
    }