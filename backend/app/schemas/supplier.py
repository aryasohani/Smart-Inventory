from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class SupplierCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    categories: str
    lead_time_days: int = 7
    address: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    categories: Optional[str] = None
    lead_time_days: Optional[int] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    categories: str
    categories_list: list[str]
    lead_time_days: int
    is_active: bool
    address: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}