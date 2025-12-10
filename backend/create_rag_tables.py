"""
Migration script to create RAG-related tables and add pgvector support
Run this script to set up the database for RAG recommendations
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError, InternalError
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:18220@localhost:5432/glowsense_db")

def execute_sql(conn, sql, description, required=False):
    """Execute SQL with proper error handling and transaction management"""
    try:
        # Use autocommit for DDL operations to avoid transaction issues
        conn.execute(text("COMMIT"))  # Ensure we're not in a failed transaction
    except:
        pass  # Ignore if no transaction
    
    try:
        conn.execute(text(sql))
        conn.commit()
        print(f"✅ {description}")
        return True
    except (ProgrammingError, InternalError) as e:
        if required:
            print(f"❌ Error: {description}")
            print(f"   {str(e)}")
            raise
        else:
            print(f"⚠️  Warning: Could not {description.lower()}")
            print(f"   {str(e)}")
            # Rollback to clear the failed transaction
            try:
                conn.rollback()
            except:
                pass
            return False
    except Exception as e:
        if required:
            print(f"❌ Error: {description}")
            print(f"   {str(e)}")
            raise
        else:
            print(f"⚠️  Warning: Could not {description.lower()}")
            print(f"   {str(e)}")
            try:
                conn.rollback()
            except:
                pass
            return False

def create_rag_tables():
    """Create RAG tables and enable pgvector extension"""
    engine = create_engine(DATABASE_URL)
    pgvector_available = False
    
    with engine.connect() as conn:
        # Enable pgvector extension
        print("Enabling pgvector extension...")
        try:
            conn.execute(text("COMMIT"))
        except:
            pass
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            print("✅ pgvector extension enabled")
            pgvector_available = True
        except (ProgrammingError, InternalError) as e:
            print(f"⚠️  Warning: Could not enable pgvector extension: {e}")
            print("   Make sure pgvector is installed on your PostgreSQL server")
            try:
                conn.rollback()
            except:
                pass
            pgvector_available = False
        except Exception as e:
            print(f"⚠️  Warning: Could not enable pgvector extension: {e}")
            try:
                conn.rollback()
            except:
                pass
            pgvector_available = False
        
        if not pgvector_available:
            print("\n📝 Note: pgvector extension is not installed on your PostgreSQL server.")
            print("   The RAG module will work, but vector similarity search will be disabled.")
            print("   To install pgvector on Windows:")
            print("   1. Download from: https://github.com/pgvector/pgvector/releases")
            print("   2. Or use a PostgreSQL distribution that includes pgvector")
            print("   3. Then run: CREATE EXTENSION vector;")
        
        # Create chat_sessions table FIRST (user_messages references it)
        print("\nCreating chat_sessions table...")
        execute_sql(
            conn,
            """
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                session_state JSONB,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
            """,
            "chat_sessions table created",
            required=True
        )
        
        # Create user_messages table
        print("Creating user_messages table...")
        execute_sql(
            conn,
            """
            CREATE TABLE IF NOT EXISTS user_messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                session_id INTEGER REFERENCES chat_sessions(id) ON DELETE SET NULL
            )
            """,
            "user_messages table created",
            required=True
        )
        
        # Add indexes
        print("\nCreating indexes...")
        execute_sql(
            conn,
            "CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id)",
            "Index on user_messages.user_id created",
            required=False
        )
        execute_sql(
            conn,
            "CREATE INDEX IF NOT EXISTS idx_user_messages_session_id ON user_messages(session_id)",
            "Index on user_messages.session_id created",
            required=False
        )
        execute_sql(
            conn,
            "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)",
            "Index on chat_sessions.user_id created",
            required=False
        )
        
        # Add embedding column to service_providers table (only if pgvector is available)
        if pgvector_available:
            print("\nAdding embedding column to service_providers table...")
            execute_sql(
                conn,
                """
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'service_providers' 
                        AND column_name = 'embedding'
                    ) THEN
                        ALTER TABLE service_providers 
                        ADD COLUMN embedding vector(1536);
                    END IF;
                END $$;
                """,
                "Embedding column added to service_providers",
                required=False
            )
            
            # Create index on embedding column for faster similarity search
            print("Creating vector index...")
            execute_sql(
                conn,
                """
                CREATE INDEX IF NOT EXISTS idx_service_providers_embedding 
                ON service_providers 
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
                """,
                "Vector index created",
                required=False
            )
        else:
            print("\n⏭️  Skipping embedding column (pgvector not available)")
    
    print("\n" + "="*60)
    print("✅ RAG tables setup complete!")
    print("="*60)
    
    if pgvector_available:
        print("\n📋 Next steps:")
        print("1. Make sure Ollama is running: ollama serve")
        print("2. Pull required models:")
        print("   - ollama pull nomic-embed-text")
        print("   - ollama pull llama3.1")
        print("3. Generate embeddings for existing providers using /rag/add-provider endpoint")
    else:
        print("\n📋 Next steps:")
        print("1. Install pgvector extension on PostgreSQL (see instructions above)")
        print("2. Re-run this script to add embedding column")
        print("3. Make sure Ollama is running: ollama serve")
        print("4. Pull required models:")
        print("   - ollama pull nomic-embed-text")
        print("   - ollama pull llama3.1")

if __name__ == "__main__":
    create_rag_tables()

