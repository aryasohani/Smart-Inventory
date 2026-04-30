from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from app.models.product import StockStatus, InventoryChangeType
import math


class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str
    stock: int = 0
    price: float
    expiry_date: Optional[date] = None
    reorder_threshold: int = 10

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    price: Optional[float] = None
    expiry_date: Optional[date] = None
    reorder_threshold: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    stock: int
    price: float
    expiry_date: Optional[date]
    reorder_threshold: int
    is_active: bool
    stock_status: StockStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockAdjustment(BaseModel):
    quantity_change: int
    change_type: InventoryChangeType
    note: Optional[str] = None


class InventoryLogResponse(BaseModel):
    id: str
    product_id: str
    change_type: InventoryChangeType
    quantity_before: int
    quantity_change: int
    quantity_after: int
    note: Optional[str]
    created_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedProducts(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int