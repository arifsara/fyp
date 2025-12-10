from sqlalchemy import text, inspect
from database import engine

def add_profile_photo():
    """Add profile_photo column if missing"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        existing_columns = [col['name'] for col in inspector.get_columns('service_providers')]
        
        if 'profile_photo' not in existing_columns:
            try:
                conn.execute(text("""
                    ALTER TABLE service_providers 
                    ADD COLUMN profile_photo VARCHAR;
                """))
                print("✅ Added profile_photo column to service_providers")
            except Exception as e:
                print(f"⚠️ Error: {e}")
        else:
            print("✅ profile_photo column already exists")
        
        print("\n🎉 Migration completed!")

if __name__ == "__main__":
    add_profile_photo()

