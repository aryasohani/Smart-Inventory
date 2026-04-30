import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        log = logger.bind(request_id=request_id, method=request.method, path=request.url.path)
        log.info("Request started")
        try:
            response = await call_next(request)
        except Exception as exc:
            log.error("Request failed", error=str(exc))
            raise
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        log.info("Request completed", status=response.status_code, duration_ms=elapsed_ms)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
        return response