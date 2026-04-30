from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.db.session import get_db
from app.models.report import Report, AutomationLog, ReportType
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime


class ReportResponse(BaseModel):
    id: str
    report_type: ReportType
    title: str
    content: dict
    created_at: datetime
    model_config = {"from_attributes": True}


class AutomationLogResponse(BaseModel):
    id: str
    job_name: str
    status: str
    message: Optional[str]
    details: Optional[dict]
    started_at: datetime
    completed_at: Optional[datetime]
    model_config = {"from_attributes": True}


router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/", response_model=list[ReportResponse])
async def list_reports(
    report_type: Optional[ReportType] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = select(Report).order_by(Report.created_at.desc()).limit(limit)
    if report_type:
        query = query.where(Report.report_type == report_type)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/automation-logs", response_model=list[AutomationLogResponse])
async def get_automation_logs(
    job_name: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = select(AutomationLog).order_by(AutomationLog.started_at.desc()).limit(limit)
    if job_name:
        query = query.where(AutomationLog.job_name == job_name)
    result = await db.execute(query)
    return result.scalars().all()