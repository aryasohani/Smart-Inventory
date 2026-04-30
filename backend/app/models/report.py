import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base
import enum


class ReportType(str, enum.Enum):
    weekly_summary = "weekly_summary"
    stock_alert = "stock_alert"
    expiry_alert = "expiry_alert"


class AutomationJobStatus(str, enum.Enum):
    success = "success"
    failed = "failed"
    running = "running"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_type: Mapped[ReportType] = mapped_column(SAEnum(ReportType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[AutomationJobStatus] = mapped_column(SAEnum(AutomationJobStatus), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)