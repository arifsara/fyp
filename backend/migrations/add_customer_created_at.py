"""
Migration script to add created_at column to customers table
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from sqlalchemy import text

def migrate():
    """Add created_at column to customers table"""
    db = SessionLocal()
    
    try:
        print("🔄 Adding created_at column to customers table...")
        
        # Check if column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'customers' 
            AND column_name = 'created_at'
        """))
        
        column_exists = result.fetchone() is not None
        
        if not column_exists:
            print("📝 Adding 'created_at' column...")
            db.execute(text("""
                ALTER TABLE customers 
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            """))
            db.commit()
            print("✅ Column added successfully")
        else:
            print("✅ 'created_at' column already exists")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

