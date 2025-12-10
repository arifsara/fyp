# Complete RAG System Setup Guide

This guide provides a complete working RAG (Retrieval-Augmented Generation) system using:
- PostgreSQL with pgvector extension
- FastAPI backend
- Ollama (nomic-embed-text for embeddings, LLaMA 3.1 for generation)
- Vector search in PostgreSQL

## 📋 Prerequisites

1. PostgreSQL installed and running
2. Ollama installed and running
3. Python 3.8+ with required packages

## 🚀 Step-by-Step Setup

### Step 1: Install Ollama Models

```powershell
# Make sure Ollama is running
ollama serve

# In another terminal, pull required models
ollama pull nomic-embed-text
ollama pull llama3.1
```

### Step 2: Setup PostgreSQL Database

#### Option A: Using SQL Script (Recommended)

```powershell
# Connect to PostgreSQL
psql -U postgres -d glowsense_db

# Run the setup script
\i C:\FYP\backend\setup_rag_database.sql

# Or copy and paste the SQL commands from setup_rag_database.sql
```

#### Option B: Manual Setup

```sql
-- Connect to your database
\c glowsense_db

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to service_providers table
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

-- Create vector index
CREATE INDEX IF NOT EXISTS beauty_vector_idx 
ON service_providers 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Step 3: Install Python Dependencies

```powershell
cd C:\FYP\backend
pip install httpx pgvector psycopg2-binary
# Or if using uv:
uv add httpx pgvector psycopg2-binary
```

### Step 4: Update Backend to Use Complete RAG

You have two options:

#### Option A: Use Complete RAG Routes (New File)

Update `backend/main.py`:

```python
# Replace this:
from rag.routes import router as rag_router

# With this:
from rag_routes_complete import router as rag_router
```

#### Option B: Update Existing Routes

Update `backend/rag/routes.py`:

```python
# Replace:
from services.rag_service import RAGService

# With:
from rag_service_complete import CompleteRAGService as RAGService
```

### Step 5: Generate Embeddings for Existing Providers

Create a script to generate embeddings for all existing service providers:

```python
# backend/generate_all_embeddings.py
import asyncio
from database import SessionLocal
from models import ServiceProvider
from rag_service_complete import CompleteRAGService

async def generate_all_embeddings():
    db = SessionLocal()
    try:
        rag_service = CompleteRAGService(db)
        
        # Get all providers without embeddings
        providers = db.query(ServiceProvider).filter(
            ServiceProvider.embedding.is_(None)
        ).all()
        
        print(f"Found {len(providers)} providers without embeddings")
        
        for provider in providers:
            try:
                beautician_data = {
                    "business_name": provider.business_name,
                    "full_name": provider.full_name,
                    "city": provider.city,
                    "bio": provider.bio,
                    "rating": 4.5,  # Default or from your data
                    "experience": 5  # Default or from your data
                }
                
                await rag_service.add_beautician_embedding(
                    provider.id,
                    beautician_data
                )
                print(f"✅ Generated embedding for provider {provider.id}")
            except Exception as e:
                print(f"❌ Error for provider {provider.id}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(generate_all_embeddings())
```

Run it:
```powershell
cd C:\FYP\backend
python generate_all_embeddings.py
```

### Step 6: Test the System

#### Test 1: Health Check

```powershell
curl http://localhost:8000/rag/health
```

Expected response:
```json
{
  "status": "healthy",
  "ollama_available": true,
  "database_connected": true,
  "pgvector_available": true
}
```

#### Test 2: Generate Embedding

```powershell
curl -X POST "http://localhost:8000/rag/embed" `
  -H "Content-Type: application/json" `
  -d '{"text": "makeup artist in New York"}'
```

#### Test 3: Search Beauticians

```powershell
curl -X POST "http://localhost:8000/rag/search" `
  -H "Content-Type: application/json" `
  -d '{"query": "makeup artist", "limit": 5}'
```

#### Test 4: Get RAG Recommendations

```powershell
curl -X POST "http://localhost:8000/rag/recommend" `
  -H "Content-Type: application/json" `
  -d '{"query": "I need a makeup artist for my wedding"}'
```

## 📡 API Endpoints

### 1. `POST /rag/embed`
Generate embedding for text.

**Request:**
```json
{
  "text": "makeup artist in New York"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...],
  "dimensions": 1536
}
```

### 2. `POST /rag/embed-beauticians`
Generate and store embedding for a beautician.

**Request:**
```json
{
  "beautician_id": 1,
  "beautician_data": {
    "name": "Jane Doe",
    "city": "New York",
    "specialties": "Makeup, Hair Styling",
    "rating": 4.8,
    "experience": 10,
    "description": "Expert makeup artist with 10 years experience"
  }
}
```

**Response:**
```json
{
  "message": "Beautician embedding added successfully",
  "beautician_id": 1
}
```

### 3. `POST /rag/search`
Vector similarity search.

**Request:**
```json
{
  "query": "makeup artist",
  "limit": 5
}
```

**Response:**
```json
{
  "beauticians": [
    {
      "id": 1,
      "name": "Jane Doe",
      "city": "New York",
      "similarity": 0.85,
      ...
    }
  ],
  "query": "makeup artist",
  "count": 5
}
```

### 4. `POST /rag/recommend`
Complete RAG pipeline.

**Request:**
```json
{
  "query": "I need a makeup artist for my wedding"
}
```

**Response:**
```json
{
  "ai_response": "Based on your query, I recommend...",
  "beauticians": [...],
  "query": "..."
}
```

## 🔧 Troubleshooting

### Issue: "pgvector extension not found"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If this fails, install pgvector:
- Windows: Download from https://github.com/pgvector/pgvector/releases
- Or use Docker with pgvector pre-installed

### Issue: "Ollama connection failed"

**Solution:**
1. Check Ollama is running: `ollama list`
2. Verify models are installed: `ollama list`
3. Test connection: `curl http://localhost:11434/api/tags`

### Issue: "No beauticians found"

**Solution:**
1. Make sure you've generated embeddings for providers
2. Run the `generate_all_embeddings.py` script
3. Check database: `SELECT COUNT(*) FROM service_providers WHERE embedding IS NOT NULL;`

### Issue: "Vector dimension mismatch"

**Solution:**
- nomic-embed-text produces 1536 dimensions
- Make sure your database column is `vector(1536)`
- Check: `SELECT embedding FROM service_providers LIMIT 1;`

## ✅ Verification Checklist

- [ ] Ollama is running
- [ ] Models are pulled (nomic-embed-text, llama3.1)
- [ ] pgvector extension is enabled
- [ ] Embedding column exists in service_providers table
- [ ] Vector index is created
- [ ] Embeddings are generated for providers
- [ ] Health check endpoint returns "healthy"
- [ ] Search endpoint returns results
- [ ] Recommend endpoint generates responses

## 🎯 Next Steps

1. Generate embeddings for all existing providers
2. Test the AI Assistant in the frontend
3. Monitor performance and optimize if needed
4. Add caching for frequently searched queries
5. Fine-tune the RAG prompt based on user feedback

---

**Your RAG system is now ready to use!** 🚀

