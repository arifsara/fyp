"""
Migration script to create time_slots table and add time_slot_id to bookings table.
Run this script to update your database schema.
"""
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:18220@localhost:5432/glowsense_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    """Create time_slots table and update bookings table"""
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Create time_slots table
            print("Creating time_slots table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS time_slots (
                    id SERIAL PRIMARY KEY,
                    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
                    slot_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    is_available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Create indexes for faster queries
            print("Creating indexes...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_time_slots_service_id ON time_slots(service_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_time_slots_slot_date ON time_slots(slot_date);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(is_available) WHERE is_available = TRUE;"))
            
            # Add time_slot_id column to bookings table (nullable for backward compatibility)
            print("Adding time_slot_id column to bookings table...")
            conn.execute(text("""
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE SET NULL;
            """))
            
            # Create index on time_slot_id
            print("Creating index on bookings.time_slot_id...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_bookings_time_slot_id ON bookings(time_slot_id);"))
            
            # Commit transaction
            trans.commit()
            print("✅ Migration completed successfully!")
            print("\nDatabase structure:")
            print("  - time_slots table created")
            print("  - time_slot_id column added to bookings table")
            print("  - Indexes created for optimal performance")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    print("Starting database migration...")
    print(f"Database: {SQLALCHEMY_DATABASE_URL.split('@')[-1] if '@' in SQLALCHEMY_DATABASE_URL else 'N/A'}")
    migrate()

