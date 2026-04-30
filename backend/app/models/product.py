import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Boolean, DateTime, Date, Float, Integer, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
import enum


class StockStatus(str, enum.Enum):
    ok = "OK"
    low = "LOW"
    critical = "CRITICAL"
    expired = "EXPIRED"


class InventoryChangeType(str, enum.Enum):
    purchase = "purchase"
    sale = "sale"
    adjustment = "adjustment"
    po_received = "po_received"
    expiry_write_off = "expiry_write_off"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    reorder_threshold: Mapped[int] = mapped_column(Integer, default=10)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    inventory_logs: Mapped[list["InventoryLog"]] = relationship("InventoryLog", back_populates="product", cascade="all, delete-orphan")

    @property
    def stock_status(self) -> StockStatus:
        today = date.today()
        if self.expiry_date and self.expiry_date <= today:
            return StockStatus.expired
        if self.stock == 0 or self.stock < self.reorder_threshold * 0.3:
            return StockStatus.critical
        if self.stock < self.reorder_threshold:
            return StockStatus.low
        return StockStatus.ok


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False, index=True)
    change_type: Mapped[InventoryChangeType] = mapped_column(SAEnum(InventoryChangeType), nullable=False)
    quantity_before: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_change: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_after: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    product: Mapped["Product"] = relationship("Product", back_populates="inventory_logs")