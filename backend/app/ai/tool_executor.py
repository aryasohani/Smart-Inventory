import json
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, POStatus
from app.models.supplier import Supplier
from app.core.logging import logger


class ToolExecutor:
    """Executes AI tool calls against the real database. Zero fake data."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute(self, tool_name: str, arguments: dict) -> str:
        """Route tool call to the correct DB query and return JSON string."""
        try:
            if tool_name == "get_low_stock_products":
                return await self._get_low_stock_products(**arguments)
            elif tool_name == "get_product_detail":
                return await self._get_product_detail(**arguments)
            elif tool_name == "get_po_history":
                return await self._get_po_history(**arguments)
            elif tool_name == "get_expiring_products":
                return await self._get_expiring_products(**arguments)
            elif tool_name == "create_draft_po":
                return await self._create_draft_po(**arguments)
            else:
                return json.dumps({"error": f"Unknown tool: {tool_name}"})
        except Exception as e:
            logger.error("Tool execution error", tool=tool_name, error=str(e))
            return json.dumps({"error": str(e)})

    async def _get_low_stock_products(self, limit: int = 20) -> str:
        result = await self.db.execute(
            select(Product).where(
                Product.is_active == True,
                Product.stock < Product.reorder_threshold,
            ).limit(limit)
        )
        products = result.scalars().all()
        data = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category,
                "stock": p.stock,
                "reorder_threshold": p.reorder_threshold,
                "stock_status": p.stock_status.value,
                "price": p.price,
            }
            for p in products
        ]
        return json.dumps({"count": len(data), "products": data})

    async def _get_product_detail(self, product_id: str = None, sku: str = None) -> str:
        query = select(Product).where(Product.is_active == True)
        if product_id:
            query = query.where(Product.id == product_id)
        elif sku:
            query = query.where(Product.sku == sku)
        else:
            return json.dumps({"error": "Must provide product_id or sku"})

        result = await self.db.execute(query)
        p = result.scalar_one_or_none()
        if not p:
            return json.dumps({"error": "Product not found"})

        return json.dumps({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category,
            "stock": p.stock,
            "price": p.price,
            "expiry_date": str(p.expiry_date) if p.expiry_date else None,
            "reorder_threshold": p.reorder_threshold,
            "stock_status": p.stock_status.value,
            "is_active": p.is_active,
        })

    async def _get_po_history(self, supplier_id: str = None, status: str = None, limit: int = 10) -> str:
        query = select(PurchaseOrder)
        if supplier_id:
            query = query.where(PurchaseOrder.supplier_id == supplier_id)
        if status:
            try:
                query = query.where(PurchaseOrder.status == POStatus(status))
            except ValueError:
                return json.dumps({"error": f"Invalid status: {status}"})

        query = query.order_by(PurchaseOrder.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        pos = result.scalars().all()

        data = [
            {
                "id": po.id,
                "supplier_id": po.supplier_id,
                "status": po.status.value,
                "total_amount": po.total_amount,
                "created_at": str(po.created_at),
                "sent_at": str(po.sent_at) if po.sent_at else None,
                "received_at": str(po.received_at) if po.received_at else None,
            }
            for po in pos
        ]
        return json.dumps({"count": len(data), "purchase_orders": data})

    async def _get_expiring_products(self, days: int = 14) -> str:
        from datetime import timedelta
        threshold = date.today() + timedelta(days=days)
        result = await self.db.execute(
            select(Product).where(
                Product.is_active == True,
                Product.expiry_date != None,
                Product.expiry_date <= threshold,
                Product.expiry_date >= date.today(),
            )
        )
        products = result.scalars().all()
        data = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock,
                "expiry_date": str(p.expiry_date),
                "days_until_expiry": (p.expiry_date - date.today()).days,
                "category": p.category,
            }
            for p in products
        ]
        return json.dumps({"count": len(data), "expiring_products": data, "threshold_days": days})

    async def _create_draft_po(self, supplier_id: str, items: list[dict], notes: str = None) -> str:
        # Verify supplier exists
        result = await self.db.execute(select(Supplier).where(Supplier.id == supplier_id))
        supplier = result.scalar_one_or_none()
        if not supplier:
            return json.dumps({"error": f"Supplier '{supplier_id}' not found"})

        from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
        po = PurchaseOrder(
            supplier_id=supplier_id,
            status=POStatus.draft,
            notes=notes or "Auto-created by AI assistant",
            created_by="ai_assistant",
        )
        self.db.add(po)
        await self.db.flush()

        total = 0.0
        for item in items:
            poi = PurchaseOrderItem(
                purchase_order_id=po.id,
                product_name=item["product_name"],
                sku=item.get("sku"),
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total_price=item["quantity"] * item["unit_price"],
            )
            total += poi.total_price
            self.db.add(poi)

        po.total_amount = total
        await self.db.flush()

        return json.dumps({
            "success": True,
            "po_id": po.id,
            "supplier_name": supplier.name,
            "total_amount": total,
            "status": "draft",
            "item_count": len(items),
        })