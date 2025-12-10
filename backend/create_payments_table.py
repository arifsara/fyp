import sys
import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Numeric, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from sqlalchemy import Index

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from database import Base, engine, SessionLocal
import models

print("Starting database migration for payments...")
print(f"Database: {engine.url.host}:{engine.url.port}/{engine.url.database}")

def create_payments_table():
    """Creates the payments table and adds payment columns to bookings."""
    conn = engine.connect()
    trans = conn.begin()
    try:
        # Check if payments table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'payments'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            # Create payments table
            print("Creating payments table...")
            conn.execute(text("""
                CREATE TABLE payments (
                    id SERIAL PRIMARY KEY,
                    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                    provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                    amount VARCHAR NOT NULL,
                    currency VARCHAR DEFAULT 'USD',
                    payment_method VARCHAR,
                    stripe_payment_intent_id VARCHAR,
                    stripe_charge_id VARCHAR,
                    stripe_customer_id VARCHAR,
                    status VARCHAR DEFAULT 'pending',
                    failure_reason TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP WITH TIME ZONE,
                    refunded_at TIMESTAMP WITH TIME ZONE
                );
            """))
        else:
            print("Payments table already exists, skipping creation...")
        print("Creating indexes...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments (provider_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments (stripe_payment_intent_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);"))
        
        # Add payment columns to bookings table
        print("Adding payment columns to bookings table...")
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'unpaid';"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;"))
        print("Creating index on bookings.payment_id...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings (payment_id);"))
        print("Creating index on bookings.payment_status...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings (payment_status);"))
        
        trans.commit()
        print("✅ Migration completed successfully!")
        print("\nDatabase structure:")
        print("  - payments table created")
        print("  - payment_status and payment_id columns added to bookings table")
        print("  - Indexes created for optimal performance")
    except Exception as e:
        trans.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    create_payments_table()

