"""
Migration script to add preferences columns to customers table.
Run this script to add skin_type, categories, and budget_range columns.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:18220@localhost:5432/glowsense_db")

def add_customer_preferences():
    """Add preferences columns to customers table"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'customers' 
                AND column_name IN ('skin_type', 'categories', 'budget_range')
            """))
            existing_columns = [row[0] for row in result]
            
            # Add skin_type column if it doesn't exist
            if 'skin_type' not in existing_columns:
                print("Adding skin_type column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN skin_type VARCHAR
                """))
                conn.commit()
                print("✅ Added skin_type column")
            else:
                print("⚠️ skin_type column already exists")
            
            # Add categories column if it doesn't exist
            if 'categories' not in existing_columns:
                print("Adding categories column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN categories TEXT
                """))
                conn.commit()
                print("✅ Added categories column")
            else:
                print("⚠️ categories column already exists")
            
            # Add budget_range column if it doesn't exist
            if 'budget_range' not in existing_columns:
                print("Adding budget_range column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN budget_range VARCHAR
                """))
                conn.commit()
                print("✅ Added budget_range column")
            else:
                print("⚠️ budget_range column already exists")
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    print("🔄 Starting customer preferences migration...\n")
    add_customer_preferences()

