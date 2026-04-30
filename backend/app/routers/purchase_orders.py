from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.session import get_db
from app.schemas.purchase_order import PurchaseOrderCreate, POStatusUpdate, PurchaseOrderResponse
from app.services.purchase_order_service import PurchaseOrderService
from app.dependencies.auth import get_current_user, require_admin
from app.models.purchase_order import POStatus
from app.models.user import User, UserRole

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_po(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PurchaseOrderService(db)
    return await service.create(data, created_by=current_user.email)


@router.get("/", response_model=list[PurchaseOrderResponse])
async def list_pos(
    supplier_id: Optional[str] = Query(None),
    status: Optional[POStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PurchaseOrderService(db)
    return await service.list_purchase_orders(supplier_id=supplier_id, status=status)


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_po(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PurchaseOrderService(db)
    return await service.get_by_id(po_id)


@router.patch("/{po_id}/status", response_model=PurchaseOrderResponse)
async def update_po_status(
    po_id: str,
    data: POStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Staff cannot send POs (only view/acknowledge)
    if current_user.role == UserRole.staff and data.status == POStatus.sent:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Staff cannot send purchase orders")

    service = PurchaseOrderService(db)
    return await service.update_status(po_id, data)


@router.post("/{po_id}/send-email")
async def send_po_email(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = PurchaseOrderService(db)
    return await service.send_email_notification(po_id)