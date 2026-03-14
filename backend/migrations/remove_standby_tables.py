"""
Migration script to remove standby support system tables.

This cleanly drops:
- standby_notifications
- standby_requests
- standby_queue
"""
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal


def migrate():
    """Drop standby-related tables if they exist."""
    db = SessionLocal()

    try:
        print("🔄 Dropping standby support system tables if they exist...")

        # Drop in dependency order (notifications/requests first, then queue)
        db.execute(text("DROP TABLE IF EXISTS standby_notifications CASCADE;"))
        db.execute(text("DROP TABLE IF EXISTS standby_requests CASCADE;"))
        db.execute(text("DROP TABLE IF EXISTS standby_queue CASCADE;"))

        db.commit()
        print("✅ Standby tables dropped successfully (if they existed).")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()


