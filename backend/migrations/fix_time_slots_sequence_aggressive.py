"""
Aggressive fix for time_slots sequence - sets it well ahead to avoid any conflicts
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from sqlalchemy import text

def fix_sequence_aggressive():
    """Fix time_slots sequence aggressively"""
    db = SessionLocal()
    
    try:
        print("🔄 Aggressively fixing time_slots sequence...")
        
        # Get the maximum ID from the table
        result = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM time_slots"))
        max_id = result.scalar() or 0
        
        # Set sequence to max_id + 1000 to avoid any conflicts
        new_seq_val = max_id + 1000
        db.execute(text(f"SELECT setval('time_slots_id_seq', {new_seq_val}, false)"))
        db.commit()
        
        # Verify
        verify_result = db.execute(text("SELECT last_value FROM time_slots_id_seq"))
        seq_val = verify_result.scalar()
        
        print(f"✅ Sequence reset from max_id {max_id} to {seq_val}")
        print(f"   This ensures no duplicate key errors for the next 1000 inserts")
        
    except Exception as e:
        print(f"❌ Failed to fix sequence: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_sequence_aggressive()

