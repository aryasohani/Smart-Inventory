from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.schemas.ai import InvoiceParseResponse
from app.ocr.ocr_service import OCRService
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/invoices", tags=["Invoice OCR"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/tiff", "application/pdf", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/parse", response_model=InvoiceParseResponse)
async def parse_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Parse an invoice image or PDF using OCR.
    
    Returns structured data: supplier name, date, line items, totals.
    Handles partial parsing with confidence scoring.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {ALLOWED_TYPES}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size: 10MB",
        )

    service = OCRService()
    return await service.parse_invoice(file_bytes, file.filename or "invoice")