"""
Migration script to add level column to service_providers table
and update existing providers' levels based on their ratings
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import ServiceProvider
from services.provider_level_service import ProviderLevelService
from sqlalchemy import text

def migrate():
    """Add level column and update existing providers"""
    db = SessionLocal()
    
    try:
        print("🔄 Starting provider level migration...")
        
        # Check if column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'service_providers' 
            AND column_name = 'level'
        """))
        
        column_exists = result.fetchone() is not None
        
        if not column_exists:
            print("📝 Adding 'level' column to service_providers table...")
            db.execute(text("""
                ALTER TABLE service_providers 
                ADD COLUMN level VARCHAR DEFAULT 'beginner'
            """))
            db.commit()
            print("✅ Column added successfully")
        else:
            print("✅ 'level' column already exists")
        
        # Update all providers' levels based on their ratings
        print("\n🔄 Updating provider levels based on ratings...")
        providers = db.query(ServiceProvider).all()
        
        updated_count = 0
        for provider in providers:
            try:
                new_level = ProviderLevelService.update_provider_level(provider.id, db)
                if new_level:
                    updated_count += 1
                    print(f"  ✓ Provider {provider.id} ({provider.full_name}): {provider.level or 'beginner'} → {new_level}")
            except Exception as e:
                print(f"  ✗ Failed to update provider {provider.id}: {e}")
        
        print(f"\n✅ Migration complete! Updated {updated_count} providers")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

