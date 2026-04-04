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

        # 2. Add embedding column to service_providers if not exists
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
            print("Adding 'embedding' column (vector: 384 dimensions)...")
            conn.execute(text("ALTER TABLE service_providers ADD COLUMN embedding vector(384);"))
        else:
            print("'embedding' column already exists.")

        # 3. Add ivfflat index on embedding
        # ivfflat index allows for fast approximate nearest neighbor search (cosine distance)
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
