from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, StockAdjustment, InventoryLogResponse, PaginatedProducts
from app.services.product_service import ProductService
from app.dependencies.auth import get_current_user, require_admin
from app.models.product import StockStatus
from app.models.user import User
from app.forecast.forecast_service import ForecastService
from app.schemas.ai import ForecastResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProductService(db)
    product = await service.create(data, created_by=current_user.email)
    return product


@router.get("/", response_model=PaginatedProducts)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    stock_status: Optional[StockStatus] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProductService(db)
    return await service.list_products(page=page, page_size=page_size, category=category, stock_status=stock_status, search=search)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProductService(db)
    return await service.get_by_id(product_id)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProductService(db)
    return await service.update(product_id, data, updated_by=current_user.email)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = ProductService(db)
    await service.soft_delete(product_id)


@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
async def adjust_stock(
    product_id: str,
    adjustment: StockAdjustment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProductService(db)
    return await service.adjust_stock(product_id, adjustment, user_email=current_user.email)


@router.get("/{product_id}/inventory-logs", response_model=list[InventoryLogResponse])
async def get_inventory_logs(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProductService(db)
    return await service.get_inventory_logs(product_id)


@router.get("/{product_id}/forecast", response_model=ForecastResponse)
async def forecast_product(
    product_id: str,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ForecastService(db)
    return await service.forecast_product(product_id, days=days)