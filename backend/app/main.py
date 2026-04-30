# from contextlib import asynccontextmanager
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse

# from app.core.config import settings, get_cors_origins
# from app.core.logging import setup_logging, logger
# from app.core.exceptions import (
#     NotFoundException, ConflictException, ForbiddenException,
#     UnauthorizedException, BadRequestException,
# )
# from app.automation.scheduler import start_scheduler, stop_scheduler
# from app.core.middleware import RequestLoggingMiddleware
# from app.routers import (
#     auth_router, products_router, suppliers_router,
#     po_router, ai_router, invoices_router, reports_router,
# )


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """Application startup and shutdown lifecycle."""
#     setup_logging()
#     logger.info("SmartStore AI starting up", env=settings.APP_ENV)

#     # Start automation scheduler
#     start_scheduler()
#     logger.info("All systems online")

#     yield

#     # Shutdown
#     stop_scheduler()
#     logger.info("SmartStore AI shut down")


# app = FastAPI(
#     title="SmartStore AI — Intelligent Inventory & Vendor Management",
#     description="""
# ## Production-grade AI-powered inventory management backend.

# ### Features:
# - **Authentication**: JWT access + refresh tokens, role-based access (Admin/Staff)
# - **Products**: Full CRUD, stock status, inventory logging, demand forecasting
# - **Suppliers**: Vendor management with CRUD operations
# - **Purchase Orders**: Full lifecycle management (Draft→Sent→Acknowledged→Received)
# - **AI Assistant**: Real LLM with tool/function calling — grounded in live DB data
# - **OCR Invoice Parsing**: Tesseract or Vision LLM for structured invoice extraction
# - **Automation**: APScheduler jobs for daily stock alerts, weekly reports, expiry alerts
#     """,
#     version="1.0.0",
#     lifespan=lifespan,
# )

# # Request logging
# app.add_middleware(RequestLoggingMiddleware)

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=get_cors_origins(),
#     # Allow local frontend dev servers on any port (e.g. 5173, 8081)
#     allow_origin_regex=r"",
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # --- Exception Handlers ---

# @app.exception_handler(NotFoundException)
# async def not_found_handler(request: Request, exc: NotFoundException):
#     return JSONResponse(status_code=404, content={"detail": exc.detail})


# @app.exception_handler(ConflictException)
# async def conflict_handler(request: Request, exc: ConflictException):
#     return JSONResponse(status_code=409, content={"detail": exc.detail})


# @app.exception_handler(ForbiddenException)
# async def forbidden_handler(request: Request, exc: ForbiddenException):
#     return JSONResponse(status_code=403, content={"detail": exc.detail})


# @app.exception_handler(UnauthorizedException)
# async def unauthorized_handler(request: Request, exc: UnauthorizedException):
#     return JSONResponse(
#         status_code=401,
#         content={"detail": exc.detail},
#         headers={"WWW-Authenticate": "Bearer"},
#     )


# @app.exception_handler(BadRequestException)
# async def bad_request_handler(request: Request, exc: BadRequestException):
#     return JSONResponse(status_code=400, content={"detail": exc.detail})


# @app.exception_handler(Exception)
# async def generic_handler(request: Request, exc: Exception):
#     logger.error("Unhandled exception", path=str(request.url), error=str(exc))
#     return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# # --- Routers ---
# app.include_router(auth_router)
# app.include_router(products_router)
# app.include_router(suppliers_router)
# app.include_router(po_router)
# app.include_router(ai_router)
# app.include_router(invoices_router)
# app.include_router(reports_router)


# @app.get("/", tags=["Health"])
# async def root():
#     return {
#         "service": settings.APP_NAME,
#         "version": "1.0.0",
#         "status": "online",
#         "docs": "/docs",
#     }


# @app.get("/health", tags=["Health"])
# async def health_check():
#     return {"status": "healthy", "env": settings.APP_ENV}

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.exceptions import (
    NotFoundException, ConflictException, ForbiddenException,
    UnauthorizedException, BadRequestException,
)
from app.automation.scheduler import start_scheduler, stop_scheduler
from app.core.middleware import RequestLoggingMiddleware
from app.routers import (
    auth_router, products_router, suppliers_router,
    po_router, ai_router, invoices_router, reports_router,
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
# App Initialization
# -------------------------------
app = FastAPI(
    title="SmartStore AI — Intelligent Inventory & Vendor Management",
    version="1.0.0",
    lifespan=lifespan,
)


# -------------------------------
# Middleware
# -------------------------------

# Request Logging
app.add_middleware(RequestLoggingMiddleware)

# ✅ CORS (PRIMARY)
ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:5173",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ FORCE CORS EVEN ON ERRORS (CRITICAL FIX)
# @app.middleware("http")
# async def force_cors_middleware(request: Request, call_next):
#     try:
#         response = await call_next(request)
#     except Exception as exc:
#         logger.error("Middleware caught exception", error=str(exc))

#         response = JSONResponse(
#             status_code=500,
#             content={"detail": str(exc)},  # show real error (debug)
#         )

#     # 🔥 ALWAYS attach CORS headers
#     origin = request.headers.get("origin")
#     if origin in ALLOWED_ORIGINS:
#         response.headers["Access-Control-Allow-Origin"] = origin
#     else:
#         response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]

#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     response.headers["Access-Control-Allow-Headers"] = "*"
#     response.headers["Access-Control-Allow-Methods"] = "*"

#     return response

@app.middleware("http")
async def cors_fix_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error("CRASH:", error=str(exc))

        # 🔥 create response manually
        response = JSONResponse(
            status_code=500,
            content={"detail": str(exc)},
        )

    # ✅ ALWAYS attach CORS
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:8081"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"

    return response

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
    logger.error("Unhandled exception", path=str(request.url), error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},  # 🔥 return real error
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
        "env": settings.APP_ENV
    }