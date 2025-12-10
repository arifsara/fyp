# RAG System Quick Start

## 🚀 Quick Setup (5 Minutes)

### 1. Setup Database (2 min)

```powershell
# Connect to PostgreSQL
psql -U postgres -d glowsense_db

# Run SQL commands
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS beauty_vector_idx 
ON service_providers 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 2. Verify Ollama (1 min)

```powershell
# Check Ollama is running
ollama list

# If models missing, pull them:
ollama pull nomic-embed-text
ollama pull llama3.1
```

### 3. Generate Embeddings (2 min)

```powershell
cd C:\FYP\backend
python generate_all_embeddings.py
```

### 4. Test (30 sec)

```powershell
# Health check
curl http://localhost:8000/rag/health

# Test recommendation
curl -X POST "http://localhost:8000/rag/recommend" `
  -H "Content-Type: application/json" `
  -d '{"query": "makeup artist"}'
```

## ✅ Done!

Your RAG system is now working. The AI Assistant should now:
- ✅ Generate embeddings for queries
- ✅ Search providers in database
- ✅ Generate responses with LLaMA 3.1
- ✅ Return recommendations

## 🔧 If Something Fails

1. **Check Ollama**: `curl http://localhost:11434/api/tags`
2. **Check Database**: `SELECT COUNT(*) FROM service_providers WHERE embedding IS NOT NULL;`
3. **Check Backend Logs**: Look for error messages in terminal

## 📚 Full Documentation

See `COMPLETE_RAG_SETUP.md` for detailed instructions.

