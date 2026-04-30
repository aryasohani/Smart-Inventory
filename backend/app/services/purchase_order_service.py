from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.schemas.purchase_order import PurchaseOrderCreate, POStatusUpdate
from app.services.supplier_service import SupplierService
from app.core.exceptions import NotFoundException, BadRequestException


# Status transition rules
VALID_TRANSITIONS = {
    POStatus.draft: [POStatus.sent, POStatus.cancelled],
    POStatus.sent: [POStatus.acknowledged, POStatus.cancelled],
    POStatus.acknowledged: [POStatus.received, POStatus.cancelled],
    POStatus.received: [],
    POStatus.cancelled: [],
}


class PurchaseOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: PurchaseOrderCreate, created_by: str) -> PurchaseOrder:
        # Verify supplier exists
        supplier_svc = SupplierService(self.db)
        await supplier_svc.get_by_id(data.supplier_id)

        po = PurchaseOrder(
            supplier_id=data.supplier_id,
            notes=data.notes,
            created_by=created_by,
            status=POStatus.draft,
        )
        self.db.add(po)
        await self.db.flush()

        total = 0.0
        for item_data in data.items:
            item = PurchaseOrderItem(
                purchase_order_id=po.id,
                product_id=item_data.product_id,
                product_name=item_data.product_name,
                sku=item_data.sku,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.quantity * item_data.unit_price,
            )
            total += item.total_price
            self.db.add(item)

        po.total_amount = total
        await self.db.flush()
        return await self.get_by_id(po.id)

    async def get_by_id(self, po_id: str) -> PurchaseOrder:
        result = await self.db.execute(
            select(PurchaseOrder)
            .options(selectinload(PurchaseOrder.items), selectinload(PurchaseOrder.supplier))
            .where(PurchaseOrder.id == po_id)
        )
        po = result.scalar_one_or_none()
        if not po:
            raise NotFoundException(f"Purchase order '{po_id}' not found")
        return po

    async def list_purchase_orders(
        self, supplier_id: str | None = None, status: POStatus | None = None
    ) -> list[PurchaseOrder]:
        query = select(PurchaseOrder).options(
            selectinload(PurchaseOrder.items), selectinload(PurchaseOrder.supplier)
        )
        if supplier_id:
            query = query.where(PurchaseOrder.supplier_id == supplier_id)
        if status:
            query = query.where(PurchaseOrder.status == status)
        query = query.order_by(PurchaseOrder.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_status(self, po_id: str, update: POStatusUpdate) -> PurchaseOrder:
        po = await self.get_by_id(po_id)
        allowed = VALID_TRANSITIONS.get(po.status, [])

        if update.status not in allowed:
            raise BadRequestException(
                f"Cannot transition from '{po.status}' to '{update.status}'. "
                f"Allowed: {[s.value for s in allowed]}"
            )

        now = datetime.now(timezone.utc)
        po.status = update.status
        if update.status == POStatus.sent:
            po.sent_at = now
        elif update.status == POStatus.acknowledged:
            po.acknowledged_at = now
        elif update.status == POStatus.received:
            po.received_at = now

        await self.db.flush()
        return await self.get_by_id(po_id)

    async def send_email_notification(self, po_id: str) -> dict:
        """
        Simulates sending email to supplier.
        In production: integrate with SendGrid/SES/SMTP.
        """
        po = await self.get_by_id(po_id)
        if po.status != POStatus.draft:
            raise BadRequestException("Only draft POs can be sent")

        # In production: send actual email here
        # For now, transition to sent and log
        po.status = POStatus.sent
        po.sent_at = datetime.now(timezone.utc)
        await self.db.flush()

        return {
            "message": f"PO {po_id} sent to {po.supplier.email}",
            "supplier_email": po.supplier.email,
            "po_id": po_id,
            "status": "sent",
        }