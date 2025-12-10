from sqlalchemy import text, inspect
from database import engine

def fix_google_id_constraint():
    """Remove unique constraint from google_id if it exists (allows multiple NULLs)"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        try:
            # Check if there's a unique constraint on google_id in service_providers
            # Drop it if it exists
            conn.execute(text("""
                DO $$ 
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'service_providers_google_id_key'
                    ) THEN
                        ALTER TABLE service_providers DROP CONSTRAINT service_providers_google_id_key;
                    END IF;
                END $$;
            """))
            print("✅ Removed unique constraint from service_providers.google_id")
        except Exception as e:
            print(f"⚠️ Constraint may not exist: {e}")
        
        try:
            # Same for customers
            conn.execute(text("""
                DO $$ 
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'customers_google_id_key'
                    ) THEN
                        ALTER TABLE customers DROP CONSTRAINT customers_google_id_key;
                    END IF;
                END $$;
            """))
            print("✅ Removed unique constraint from customers.google_id")
        except Exception as e:
            print(f"⚠️ Constraint may not exist: {e}")
        
        print("\n🎉 Constraint fix completed!")

if __name__ == "__main__":
    fix_google_id_constraint()

