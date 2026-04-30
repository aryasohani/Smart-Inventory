from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.purchase_order import POStatus


class POItemCreate(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    sku: Optional[str] = None
    quantity: int
    unit_price: float


class POItemResponse(BaseModel):
    id: str
    product_id: Optional[str]
    product_name: str
    sku: Optional[str]
    quantity: int
    unit_price: float
    total_price: float

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    items: list[POItemCreate]
    notes: Optional[str] = None


class POStatusUpdate(BaseModel):
    status: POStatus


class PurchaseOrderResponse(BaseModel):
    id: str
    supplier_id: str
    status: POStatus
    notes: Optional[str]
    total_amount: float
    created_by: Optional[str]
    sent_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    received_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: list[POItemResponse]

    model_config = {"from_attributes": True}