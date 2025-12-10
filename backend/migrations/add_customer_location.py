"""
Migration script to add location column to customers table
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from sqlalchemy import text

def migrate():
    """Add location column to customers table"""
    db = SessionLocal()
    
    try:
        print("🔄 Adding location column to customers table...")
        
        # Check if column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'customers' 
            AND column_name = 'location'
        """))
        
        column_exists = result.fetchone() is not None
        
        if not column_exists:
            print("📝 Adding 'location' column...")
            db.execute(text("""
                ALTER TABLE customers 
                ADD COLUMN location VARCHAR
            """))
            db.commit()
            print("✅ Column added successfully")
        else:
            print("✅ 'location' column already exists")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

