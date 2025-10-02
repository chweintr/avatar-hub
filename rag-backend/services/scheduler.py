"""
Scheduling service for automated data updates
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from ..utils.config import settings
from .data_updater import DataUpdaterService

logger = logging.getLogger(__name__)

class UpdateScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone='UTC')
        self.data_updater = DataUpdaterService()
        self._running = False
        
    def start(self):
        """Start the scheduler"""
        if self._running:
            logger.warning("Scheduler already running")
            return
            
        # Add update job based on configuration
        self._add_update_job()
        
        # Add other maintenance jobs
        self._add_cleanup_job()
        
        # Start scheduler
        self.scheduler.start()
        self._running = True
        logger.info("Update scheduler started")
        
    def stop(self):
        """Stop the scheduler"""
        if not self._running:
            return
            
        self.scheduler.shutdown(wait=True)
        self._running = False
        logger.info("Update scheduler stopped")
        
    def _add_update_job(self):
        """Add the main update job"""
        schedule = settings.UPDATE_SCHEDULE
        
        if schedule.startswith("cron:"):
            # Cron expression format: "cron:0 0 * * *" (daily at midnight)
            cron_expr = schedule[5:]
            parts = cron_expr.split()
            if len(parts) == 5:
                trigger = CronTrigger(
                    minute=parts[0],
                    hour=parts[1],
                    day=parts[2],
                    month=parts[3],
                    day_of_week=parts[4]
                )
            else:
                logger.error(f"Invalid cron expression: {cron_expr}")
                # Default to daily
                trigger = CronTrigger(hour=0, minute=0)
        
        elif schedule.startswith("interval:"):
            # Interval format: "interval:24h" or "interval:7d"
            interval_str = schedule[9:]
            if interval_str.endswith('h'):
                hours = int(interval_str[:-1])
                trigger = IntervalTrigger(hours=hours)
            elif interval_str.endswith('d'):
                days = int(interval_str[:-1])
                trigger = IntervalTrigger(days=days)
            elif interval_str.endswith('m'):
                minutes = int(interval_str[:-1])
                trigger = IntervalTrigger(minutes=minutes)
            else:
                logger.error(f"Invalid interval format: {interval_str}")
                # Default to daily
                trigger = IntervalTrigger(days=1)
        
        else:
            # Default to daily updates
            logger.warning(f"Unknown schedule format: {schedule}, defaulting to daily")
            trigger = CronTrigger(hour=0, minute=0)
        
        self.scheduler.add_job(
            self._run_update,
            trigger=trigger,
            id='knowledge_base_update',
            name='Knowledge Base Update',
            misfire_grace_time=3600,  # Allow up to 1 hour late
            coalesce=True,  # Only run once if multiple misfires
            max_instances=1  # Only one update at a time
        )
        
        logger.info(f"Scheduled knowledge base updates with trigger: {trigger}")
        
        # Also schedule an immediate update on startup if enabled
        if settings.UPDATE_ON_STARTUP:
            self.scheduler.add_job(
                self._run_update,
                'date',  # Run once
                id='startup_update',
                name='Startup Knowledge Base Update'
            )
    
    def _add_cleanup_job(self):
        """Add job to clean up old entries"""
        # Run cleanup weekly
        self.scheduler.add_job(
            self._run_cleanup,
            CronTrigger(day_of_week=0, hour=3, minute=0),  # Sunday 3 AM
            id='cleanup_old_entries',
            name='Cleanup Old Entries'
        )
    
    async def _run_update(self):
        """Run the update process"""
        logger.info("Starting scheduled knowledge base update")
        start_time = datetime.now()
        
        try:
            stats = await self.data_updater.update_knowledge_base()
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"Update completed in {duration:.1f}s. "
                f"New: {stats['new']}, Updated: {stats['updated']}, Errors: {stats['errors']}"
            )
            
            # Send notification if configured
            if settings.NOTIFICATION_WEBHOOK and (stats['new'] > 0 or stats['errors'] > 0):
                await self._send_notification(stats, duration)
                
        except Exception as e:
            logger.error(f"Error during scheduled update: {e}")
            # Send error notification
            if settings.NOTIFICATION_WEBHOOK:
                await self._send_error_notification(str(e))
    
    async def _run_cleanup(self):
        """Clean up old entries with expired deadlines"""
        logger.info("Running cleanup of expired entries")
        
        try:
            # This would be implemented to remove entries with all deadlines passed
            # For now, just log
            logger.info("Cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    async def _send_notification(self, stats: dict, duration: float):
        """Send update notification to webhook"""
        try:
            import httpx
            
            message = {
                "text": f"Knowledge Base Update Complete",
                "stats": stats,
                "duration_seconds": duration,
                "timestamp": datetime.now().isoformat()
            }
            
            async with httpx.AsyncClient() as client:
                await client.post(
                    settings.NOTIFICATION_WEBHOOK,
                    json=message,
                    timeout=10.0
                )
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
    
    async def _send_error_notification(self, error_message: str):
        """Send error notification to webhook"""
        try:
            import httpx
            
            message = {
                "text": "Knowledge Base Update Failed",
                "error": error_message,
                "timestamp": datetime.now().isoformat()
            }
            
            async with httpx.AsyncClient() as client:
                await client.post(
                    settings.NOTIFICATION_WEBHOOK,
                    json=message,
                    timeout=10.0
                )
        except Exception as e:
            logger.error(f"Error sending error notification: {e}")
    
    async def trigger_manual_update(self) -> dict:
        """Trigger a manual update (for API endpoint)"""
        logger.info("Manual update triggered")
        return await self.data_updater.update_knowledge_base()

# Global scheduler instance
scheduler = UpdateScheduler()