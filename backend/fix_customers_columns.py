from sqlalchemy import text, inspect
from database import engine

def add_missing_columns():
    """Add missing columns if missing for customers table"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        existing_columns = [col['name'] for col in inspector.get_columns('customers')]
        
        columns_to_add = [
            ("skin_type", "VARCHAR"),
            ("categories", "TEXT"),
            ("budget_range", "VARCHAR")
        ]

        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                try:
                    conn.execute(text(f"""
                        ALTER TABLE customers 
                        ADD COLUMN {col_name} {col_type};
                    """))
                    print(f"Added {col_name} column to customers")
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")
            else:
                print(f"{col_name} column already exists in customers")

if __name__ == "__main__":
    add_missing_columns()
