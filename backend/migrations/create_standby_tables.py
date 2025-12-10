"""
Migration script to create standby support system tables
"""
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine

def migrate():
    """Create standby tables"""
    db = SessionLocal()
    
    try:
        print("🔄 Creating standby support system tables...")
        
        # Create standby_queue table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS standby_queue (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
                slot_date TIMESTAMP WITH TIME ZONE NOT NULL,
                slot_start_time TIME,
                slot_end_time TIME,
                added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                notified_provider BOOLEAN DEFAULT FALSE
            )
        """))
        
        # Create standby_notifications table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS standby_notifications (
                id SERIAL PRIMARY KEY,
                provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                standby_queue_id INTEGER REFERENCES standby_queue(id) ON DELETE SET NULL,
                message TEXT NOT NULL,
                days_shown INTEGER DEFAULT 5,
                shown_until TIMESTAMP WITH TIME ZONE NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        """))
        
        # Create standby_requests table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS standby_requests (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                cancelled_booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                original_booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
                original_service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
                status VARCHAR DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                matched_provider_id INTEGER REFERENCES service_providers(id) ON DELETE SET NULL,
                matched_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # Create indexes
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_standby_queue_provider ON standby_queue(provider_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_standby_queue_active ON standby_queue(is_active, expires_at)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_standby_notifications_provider ON standby_notifications(provider_id, shown_until)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_standby_requests_customer ON standby_requests(customer_id, status)
        """))
        
        db.commit()
        print("✅ Standby tables created successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

