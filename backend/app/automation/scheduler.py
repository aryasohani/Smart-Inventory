from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from app.automation.jobs import _daily_stock_alert, _weekly_report, _expiry_alert
from app.core.logging import logger

scheduler = AsyncIOScheduler(timezone="UTC")


def setup_scheduler():
    """Register all automation jobs with their schedules."""

    # JOB 1: Daily stock alert at 8:00 AM UTC
    scheduler.add_job(
        _daily_stock_alert,
        trigger=CronTrigger(hour=8, minute=0),
        id="daily_stock_alert",
        name="Daily Stock Alert & Auto Draft PO",
        replace_existing=True,
        misfire_grace_time=300,
    )

    # JOB 2: Weekly report every Monday at 7:00 AM UTC
    scheduler.add_job(
        _weekly_report,
        trigger=CronTrigger(day_of_week="mon", hour=7, minute=0),
        id="weekly_report",
        name="Weekly Inventory Report",
        replace_existing=True,
        misfire_grace_time=600,
    )

    # JOB 3: Expiry alert daily at 9:00 AM UTC
    scheduler.add_job(
        _expiry_alert,
        trigger=CronTrigger(hour=9, minute=0),
        id="expiry_alert",
        name="Daily Expiry Alert",
        replace_existing=True,
        misfire_grace_time=300,
    )

    logger.info("Scheduler configured", job_count=len(scheduler.get_jobs()))
    return scheduler


def start_scheduler():
    setup_scheduler()
    scheduler.start()
    logger.info("Automation scheduler started")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Automation scheduler stopped")