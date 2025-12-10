from sqlalchemy import text, inspect
from database import engine

def add_missing_created_at():
    """Add created_at column if missing"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        existing_columns = [col['name'] for col in inspector.get_columns('service_providers')]
        
        if 'created_at' not in existing_columns:
            try:
                conn.execute(text("""
                    ALTER TABLE service_providers 
                    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                """))
                print("✅ Added created_at column to service_providers")
            except Exception as e:
                print(f"⚠️ Error: {e}")
        else:
            print("✅ created_at column already exists")
        
        # Also check portfolio_items and services tables
        try:
            portfolio_cols = [col['name'] for col in inspector.get_columns('portfolio_items')]
            if 'created_at' not in portfolio_cols:
                conn.execute(text("""
                    ALTER TABLE portfolio_items 
                    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                """))
                print("✅ Added created_at to portfolio_items")
        except Exception as e:
            print(f"⚠️ portfolio_items: {e}")
        
        try:
            services_cols = [col['name'] for col in inspector.get_columns('services')]
            if 'created_at' not in services_cols:
                conn.execute(text("""
                    ALTER TABLE services 
                    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                """))
                print("✅ Added created_at to services")
        except Exception as e:
            print(f"⚠️ services: {e}")
        
        print("\n🎉 Migration completed!")

if __name__ == "__main__":
    add_missing_created_at()

