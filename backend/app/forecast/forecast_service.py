import statistics
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product, InventoryLog, InventoryChangeType
from app.schemas.ai import ForecastResponse
from app.core.exceptions import NotFoundException


class ForecastService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def forecast_product(self, product_id: str, days: int = 7) -> ForecastResponse:
        # Fetch product
        result = await self.db.execute(
            select(Product).where(Product.id == product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundException(f"Product '{product_id}' not found")

        # Fetch recent sales from inventory logs (negative changes = sales)
        cutoff = date.today() - timedelta(days=90)
        log_result = await self.db.execute(
            select(InventoryLog).where(
                InventoryLog.product_id == product_id,
                InventoryLog.change_type == InventoryChangeType.sale,
                InventoryLog.created_at >= cutoff,
            ).order_by(InventoryLog.created_at.asc())
        )
        logs = log_result.scalars().all()

        # Build daily demand series
        daily_demand = self._aggregate_daily_demand(logs)

        if len(daily_demand) < 3:
            # Fallback: use average based on reorder threshold
            avg = product.reorder_threshold * 0.1
            forecast = [round(avg, 2)] * days
            method = "fallback_threshold"
        elif len(daily_demand) <= 7:
            forecast = self._moving_average(daily_demand, window=min(3, len(daily_demand)), days=days)
            method = "moving_average"
        else:
            forecast = self._exponential_smoothing(daily_demand, alpha=0.3, days=days)
            method = "exponential_smoothing"

        avg_demand = statistics.mean(daily_demand) if daily_demand else 0.0

        return ForecastResponse(
            product_id=product_id,
            product_name=product.name,
            forecast_days=days,
            forecast=forecast,
            method=method,
            average_daily_demand=round(avg_demand, 2),
        )

    def _aggregate_daily_demand(self, logs: list[InventoryLog]) -> list[float]:
        """Group inventory log entries by day and sum quantities sold."""
        daily: dict[date, float] = {}
        for log in logs:
            day = log.created_at.date()
            daily[day] = daily.get(day, 0) + abs(log.quantity_change)

        # Fill in zero-demand days
        if not daily:
            return []
        start = min(daily.keys())
        end = max(daily.keys())
        series = []
        current = start
        while current <= end:
            series.append(daily.get(current, 0.0))
            current += timedelta(days=1)
        return series

    def _moving_average(self, series: list[float], window: int, days: int) -> list[float]:
        """Simple moving average forecast."""
        if len(series) < window:
            window = len(series)
        recent = series[-window:]
        avg = sum(recent) / window
        return [round(avg, 2)] * days

    def _exponential_smoothing(self, series: list[float], alpha: float, days: int) -> list[float]:
        """Single exponential smoothing (Holt's simple)."""
        smoothed = series[0]
        for val in series[1:]:
            smoothed = alpha * val + (1 - alpha) * smoothed

        # Project forward with slight decay
        forecast = []
        current = smoothed
        for i in range(days):
            forecast.append(round(max(0, current), 2))
            # Very slight decay to account for uncertainty
            current = current * 0.99
        return forecast