from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.core.exceptions import NotFoundException, ConflictException


class SupplierService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: SupplierCreate) -> Supplier:
        result = await self.db.execute(select(Supplier).where(Supplier.email == data.email))
        if result.scalar_one_or_none():
            raise ConflictException("Supplier with this email already exists")

        supplier = Supplier(**data.model_dump())
        self.db.add(supplier)
        await self.db.flush()
        return supplier

    async def get_by_id(self, supplier_id: str) -> Supplier:
        result = await self.db.execute(
            select(Supplier).where(Supplier.id == supplier_id)
        )
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise NotFoundException(f"Supplier '{supplier_id}' not found")
        return supplier

    async def list_suppliers(self, active_only: bool = True) -> list[Supplier]:
        query = select(Supplier)
        if active_only:
            query = query.where(Supplier.is_active == True)
        result = await self.db.execute(query.order_by(Supplier.name))
        return result.scalars().all()

    async def update(self, supplier_id: str, data: SupplierUpdate) -> Supplier:
        supplier = await self.get_by_id(supplier_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(supplier, field, value)
        await self.db.flush()
        return supplier

    async def delete(self, supplier_id: str) -> None:
        supplier = await self.get_by_id(supplier_id)
        supplier.is_active = False
        await self.db.flush()