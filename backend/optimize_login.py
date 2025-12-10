"""
Script to optimize database for faster login:
1. Add indexes on email columns
2. Verify existing indexes
"""
from sqlalchemy import text, inspect
from database import engine

def optimize_database():
    """Add indexes for faster login queries"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        # Get existing indexes
        customer_indexes = [idx['name'] for idx in inspector.get_indexes('customers')]
        provider_indexes = [idx['name'] for idx in inspector.get_indexes('service_providers')]
        
        print("📊 Current Indexes:")
        print(f"Customers: {customer_indexes}")
        print(f"Service Providers: {provider_indexes}")
        
        # Check if email index exists (PostgreSQL creates unique indexes automatically for unique columns)
        # But we can add a regular index if needed for faster lookups
        
        # For customers table
        if 'customers_email_key' not in customer_indexes and 'ix_customers_email' not in customer_indexes:
            try:
                # Check if unique constraint exists
                conn.execute(text("""
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'customers_email_key'
                        ) THEN
                            CREATE UNIQUE INDEX IF NOT EXISTS customers_email_key ON customers(email);
                        END IF;
                    END $$;
                """))
                print("✅ Ensured email index on customers table")
            except Exception as e:
                print(f"⚠️ Email index on customers may already exist: {e}")
        
        # For service_providers table
        if 'service_providers_email_key' not in provider_indexes and 'ix_service_providers_email' not in provider_indexes:
            try:
                conn.execute(text("""
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'service_providers_email_key'
                        ) THEN
                            CREATE UNIQUE INDEX IF NOT EXISTS service_providers_email_key ON service_providers(email);
                        END IF;
                    END $$;
                """))
                print("✅ Ensured email index on service_providers table")
            except Exception as e:
                print(f"⚠️ Email index on service_providers may already exist: {e}")
        
        # Add index on google_id for faster Google OAuth lookups
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_customers_google_id ON customers(google_id) 
                WHERE google_id IS NOT NULL;
            """))
            print("✅ Added index on customers.google_id")
        except Exception as e:
            print(f"⚠️ Index on customers.google_id may already exist: {e}")
        
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_providers_google_id ON service_providers(google_id) 
                WHERE google_id IS NOT NULL;
            """))
            print("✅ Added index on service_providers.google_id")
        except Exception as e:
            print(f"⚠️ Index on service_providers.google_id may already exist: {e}")
        
        print("\n🎉 Database optimization completed!")
        print("\n💡 Tips for faster login:")
        print("   - Email columns are now indexed for fast lookups")
        print("   - Consider reducing Argon2 time_cost if still slow (see auth.py)")

if __name__ == "__main__":
    optimize_database()

