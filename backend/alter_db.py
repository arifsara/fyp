import os
from sqlalchemy import create_engine, text

# Get URL from env or use default
url = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/glowsense_db")
engine = create_engine(url)

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE portfolio_items ADD COLUMN experience_details TEXT;"))
        conn.commit()
    print("Column added successfully or already exists.")
except Exception as e:
    print(f"Error: {e}")
