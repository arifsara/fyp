from database import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("\n✅ SUCCESS: Connected to 'glowsense_db' successfully!")
except Exception as e:
    print("\n❌ ERROR: Could not connect to database.")
    print(f"Details: {e}")

