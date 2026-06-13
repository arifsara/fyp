"""
Migration: Add pgvector extension, embedding column to service_providers, and ivfflat index.
Run: python migrations/add_vector_column.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def migrate():
    conn = engine.connect()
    trans = conn.begin()
    try:
        # 1. Enable pgvector extension
        print("Ensuring pgvector extension exists...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))

        # 2. Check if column exists
        print("Checking if 'embedding' column exists on service_providers...")
        exists = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'service_providers' 
                AND column_name = 'embedding'
            );
        """)).scalar()

        if not exists:
            print("Adding 'embedding' column (vector: 1536 dimensions)...")
            conn.execute(text("ALTER TABLE service_providers ADD COLUMN embedding vector(1536);"))
        else:
            # 3. Check current column type
            print("Checking column type...")
            col_type = conn.execute(text("""
                SELECT udt_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'service_providers' 
                AND column_name = 'embedding';
            """)).scalar()

            print(f"Current column type: {col_type}")

            if col_type != 'vector':
                print(f"Column is '{col_type}', converting to vector(1536)...")
                conn.execute(text("""
                    ALTER TABLE service_providers 
                    ALTER COLUMN embedding TYPE vector(1536) 
                    USING embedding::vector(1536);
                """))
                print("✅ Column converted to vector(1536)")
            else:
                print("Column is already vector type, skipping conversion.")

        # 4. Create ivfflat index
        print("Creating index on 'embedding' column...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_service_providers_embedding 
            ON service_providers 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """))

        trans.commit()
        print("✅ Vector migration completed successfully!")
    except Exception as e:
        trans.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()