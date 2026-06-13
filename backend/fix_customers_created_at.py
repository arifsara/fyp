from sqlalchemy import text, inspect
from database import engine

def add_missing_created_at():
    """Add created_at column if missing for customers table"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        existing_columns = [col['name'] for col in inspector.get_columns('customers')]
        
        if 'created_at' not in existing_columns:
            try:
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                """))
                print("Added created_at column to customers")
            except Exception as e:
                print(f"Error: {e}")
        else:
            print("created_at column already exists in customers")

if __name__ == "__main__":
    add_missing_created_at()
