from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    response: str
    tool_calls_made: list[str] = []


class ForecastResponse(BaseModel):
    product_id: str
    product_name: str
    forecast_days: int
    forecast: list[float]
    method: str
    average_daily_demand: float


class InvoiceLineItem(BaseModel):
    name: str
    qty: float
    unit_price: float
    total: float


class InvoiceParseResponse(BaseModel):
    supplier_name: Optional[str]
    invoice_date: Optional[str]
    invoice_number: Optional[str]
    line_items: list[InvoiceLineItem]
    grand_total: Optional[float]
    raw_text: Optional[str] = None
    parse_confidence: str