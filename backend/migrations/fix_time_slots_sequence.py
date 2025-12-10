"""
Migration script to fix time_slots sequence
Resets the sequence to the maximum ID + 1 to prevent duplicate key errors
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from sqlalchemy import text

def fix_sequence():
    """Fix time_slots sequence"""
    db = SessionLocal()
    
    try:
        print("🔄 Fixing time_slots sequence...")
        
        # Get the maximum ID from the table
        result = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM time_slots"))
        max_id = result.scalar() or 0
        
        if max_id > 0:
            # Reset the sequence to max_id + 1
            db.execute(text(f"SELECT setval('time_slots_id_seq', {max_id + 1}, false)"))
            db.commit()
            print(f"✅ Sequence reset to {max_id + 1}")
        else:
            # If table is empty, reset to 1
            db.execute(text("SELECT setval('time_slots_id_seq', 1, false)"))
            db.commit()
            print("✅ Sequence reset to 1 (table was empty)")
        
    except Exception as e:
        print(f"❌ Failed to fix sequence: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_sequence()

