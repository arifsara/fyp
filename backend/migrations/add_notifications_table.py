"""
Migration: Create 'notifications' table for in-app notification bell.
Run: python migrations/add_notifications_table.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def migrate():
    conn = engine.connect()
    trans = conn.begin()
    try:
        # Check if table exists
        exists = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'notifications'
            );
        """)).scalar()

        if not exists:
            print("Creating notifications table...")
            conn.execute(text("""
                CREATE TABLE notifications (
                    id SERIAL PRIMARY KEY,
                    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                    provider_id INTEGER REFERENCES service_providers(id) ON DELETE CASCADE,
                    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
                    type VARCHAR NOT NULL,
                    title VARCHAR NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    data TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications (customer_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notifications_provider_id ON notifications (provider_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);"))
            print("✅ notifications table created")
        else:
            print("notifications table already exists, skipping.")

        trans.commit()
        print("✅ Migration completed!")
    except Exception as e:
        trans.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
