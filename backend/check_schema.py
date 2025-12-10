from sqlalchemy import text, inspect
from database import engine

def check_schema():
    """Check if all required columns exist in the database"""
    inspector = inspect(engine)
    
    print("=== Checking service_providers table ===")
    try:
        columns = inspector.get_columns('service_providers')
        print(f"Found {len(columns)} columns:")
        for col in columns:
            print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
    except Exception as e:
        print(f"❌ Error checking service_providers: {e}")
    
    print("\n=== Checking customers table ===")
    try:
        columns = inspector.get_columns('customers')
        print(f"Found {len(columns)} columns:")
        for col in columns:
            print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
    except Exception as e:
        print(f"❌ Error checking customers: {e}")
    
    print("\n=== Testing a simple query ===")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM service_providers"))
            count = result.scalar()
            print(f"✅ service_providers table exists and has {count} rows")
    except Exception as e:
        print(f"❌ Query failed: {e}")

if __name__ == "__main__":
    check_schema()

