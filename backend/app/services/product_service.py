import math
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.product import Product, InventoryLog, StockStatus, InventoryChangeType
from app.schemas.product import ProductCreate, ProductUpdate, StockAdjustment, PaginatedProducts, ProductResponse
from app.core.exceptions import NotFoundException, ConflictException
from typing import Optional


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ProductCreate, created_by: str) -> Product:
        result = await self.db.execute(select(Product).where(Product.sku == data.sku))
        if result.scalar_one_or_none():
            raise ConflictException(f"Product with SKU '{data.sku}' already exists")

        product = Product(**data.model_dump())
        self.db.add(product)
        await self.db.flush()

        # Log initial stock if > 0
        if product.stock > 0:
            log = InventoryLog(
                product_id=product.id,
                change_type=InventoryChangeType.adjustment,
                quantity_before=0,
                quantity_change=product.stock,
                quantity_after=product.stock,
                note="Initial stock",
                created_by=created_by,
            )
            self.db.add(log)

        return product

    async def get_by_id(self, product_id: str) -> Product:
        result = await self.db.execute(
            select(Product).where(Product.id == product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundException(f"Product '{product_id}' not found")
        return product

    async def list_products(
        self,
        page: int = 1,
        page_size: int = 20,
        category: Optional[str] = None,
        stock_status: Optional[StockStatus] = None,
        search: Optional[str] = None,
    ) -> PaginatedProducts:
        query = select(Product).where(Product.is_active == True)

        if category:
            query = query.where(Product.category == category)
        if search:
            query = query.where(
                or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"))
            )

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        products = result.scalars().all()

        # Filter by stock_status in Python (computed property)
        if stock_status:
            products = [p for p in products if p.stock_status == stock_status]
            total = len(products)

        return PaginatedProducts(
            items=[ProductResponse.model_validate(p) for p in products],
            total=total,
            page=page,
            page_size=page_size,
            pages=math.ceil(total / page_size) if total else 0,
        )

    async def update(self, product_id: str, data: ProductUpdate, updated_by: str) -> Product:
        product = await self.get_by_id(product_id)
        update_data = data.model_dump(exclude_none=True)

        old_stock = product.stock
        for field, value in update_data.items():
            setattr(product, field, value)

        if "stock" in update_data and update_data["stock"] != old_stock:
            log = InventoryLog(
                product_id=product.id,
                change_type=InventoryChangeType.adjustment,
                quantity_before=old_stock,
                quantity_change=update_data["stock"] - old_stock,
                quantity_after=update_data["stock"],
                note="Manual update",
                created_by=updated_by,
            )
            self.db.add(log)

        await self.db.flush()
        return product

    async def soft_delete(self, product_id: str) -> None:
        product = await self.get_by_id(product_id)
        product.is_active = False
        await self.db.flush()

    async def adjust_stock(self, product_id: str, adjustment: StockAdjustment, user_email: str) -> Product:
        product = await self.get_by_id(product_id)
        old_stock = product.stock
        new_stock = old_stock + adjustment.quantity_change

        if new_stock < 0:
            raise ConflictException("Insufficient stock for this operation")

        product.stock = new_stock
        log = InventoryLog(
            product_id=product.id,
            change_type=adjustment.change_type,
            quantity_before=old_stock,
            quantity_change=adjustment.quantity_change,
            quantity_after=new_stock,
            note=adjustment.note,
            created_by=user_email,
        )
        self.db.add(log)
        await self.db.flush()
        return product

    async def get_inventory_logs(self, product_id: str) -> list[InventoryLog]:
        result = await self.db.execute(
            select(InventoryLog)
            .where(InventoryLog.product_id == product_id)
            .order_by(InventoryLog.created_at.desc())
            .limit(100)
        )
        return result.scalars().all()

    async def get_low_stock_products(self, limit: int = 50) -> list[Product]:
        result = await self.db.execute(
            select(Product).where(
                Product.is_active == True,
                Product.stock < Product.reorder_threshold,
            ).limit(limit)
        )
        return result.scalars().all()

    async def get_expiring_products(self, days: int = 14) -> list[Product]:
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
        return result.scalars().all()