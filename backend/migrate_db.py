from sqlalchemy import text, inspect
from database import engine

def add_missing_columns():
    """Add missing columns to existing tables without dropping data"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        # Get existing columns for service_providers
        existing_columns = [col['name'] for col in inspector.get_columns('service_providers')]
        
        # Add missing columns to service_providers
        columns_to_add = {
            'cnic_id': 'VARCHAR',
            'certificates': 'TEXT',
            'business_license': 'VARCHAR',
            'google_id': 'VARCHAR',
            'profile_picture': 'VARCHAR'
        }
        
        for col_name, col_type in columns_to_add.items():
            if col_name not in existing_columns:
                try:
                    conn.execute(text(f"ALTER TABLE service_providers ADD COLUMN {col_name} {col_type};"))
                    print(f"✅ Added column: {col_name} to service_providers")
                except Exception as e:
                    print(f"⚠️ Error adding {col_name}: {e}")
        
        # Make hashed_password nullable if it isn't already
        try:
            conn.execute(text("ALTER TABLE service_providers ALTER COLUMN hashed_password DROP NOT NULL;"))
            print("✅ Made hashed_password nullable in service_providers")
        except Exception as e:
            print(f"⚠️ hashed_password may already be nullable: {e}")
        
        # Get existing columns for customers
        existing_customer_columns = [col['name'] for col in inspector.get_columns('customers')]
        
        # Add missing columns to customers
        customer_columns_to_add = {
            'google_id': 'VARCHAR',
            'profile_picture': 'VARCHAR'
        }
        
        for col_name, col_type in customer_columns_to_add.items():
            if col_name not in existing_customer_columns:
                try:
                    conn.execute(text(f"ALTER TABLE customers ADD COLUMN {col_name} {col_type};"))
                    print(f"✅ Added column: {col_name} to customers")
                except Exception as e:
                    print(f"⚠️ Error adding {col_name}: {e}")
        
        # Make hashed_password nullable in customers
        try:
            conn.execute(text("ALTER TABLE customers ALTER COLUMN hashed_password DROP NOT NULL;"))
            print("✅ Made hashed_password nullable in customers")
        except Exception as e:
            print(f"⚠️ hashed_password may already be nullable: {e}")
        
        print("\n🎉 Database migration completed!")

if __name__ == "__main__":
    add_missing_columns()
