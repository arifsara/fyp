# Final Steps - RAG Module Setup

## ✅ What's Complete

- [x] Docker PostgreSQL with pgvector set up
- [x] Database backup restored
- [x] RAG tables created
- [x] Ollama installed and running

---

## Step 1: Pull Required Models

**Open a terminal and run:**

```powershell
# Pull embedding model (for vector search)
ollama pull nomic-embed-text

# Pull LLM model (for AI responses)
ollama pull llama3.1
```

**Note:** This will download the models (may take 5-10 minutes depending on internet speed).

**Models needed:**
- `nomic-embed-text` - Generates embeddings for vector search
- `llama3.1` - Generates AI responses

---

## Step 2: Verify Models

After pulling, verify they're installed:

```powershell
ollama list
```

Should show:
```
NAME                ID              SIZE    MODIFIED
nomic-embed-text    ...             ...     ...
llama3.1            ...             ...     ...
```

---

## Step 3: Start Your Backend Server

```powershell
cd C:\FYP\backend
uvicorn main:app --reload
```

**Keep this terminal open** - your backend needs to keep running.

---

## Step 4: Test RAG Module

### Test 1: Health Check

**In a new terminal:**

```powershell
curl http://localhost:8000/rag/health
```

**Expected:** `{"status":"RAG module is healthy"}`

### Test 2: Test Chat Endpoint

```powershell
# You'll need a valid JWT token from your login
curl -X POST "http://localhost:8000/rag/chat" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"message": "Find me a makeup artist"}'
```

### Test 3: Test Recommendation Endpoint

```powershell
curl -X POST "http://localhost:8000/rag/recommend" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"query": "I need a hairstylist"}'
```

---

## Step 5: Generate Embeddings for Existing Providers

**Important:** For the RAG module to work with your existing service providers, you need to generate embeddings for them.

### Option 1: Use the API Endpoint

For each provider, call:

```powershell
curl -X POST "http://localhost:8000/rag/add-provider" `
  -H "Content-Type: application/json" `
  -d '{
    "provider_id": 1,
    "name": "Provider Name",
    "description": "Provider bio/description",
    "skills": "Skills, certificates, specialties"
  }'
```

### Option 2: Create a Script

Create `generate_provider_embeddings.py`:

```python
import requests
import os
from database import SessionLocal
from models import ServiceProvider

db = SessionLocal()
providers = db.query(ServiceProvider).all()

for provider in providers:
    response = requests.post(
        "http://localhost:8000/rag/add-provider",
        json={
            "provider_id": provider.id,
            "name": provider.full_name,
            "description": provider.bio or "",
            "skills": provider.certificates or ""
        }
    )
    print(f"Provider {provider.id}: {response.status_code}")

db.close()
```

---

## Complete Setup Checklist

- [x] Docker PostgreSQL with pgvector
- [x] Database restored
- [x] RAG tables created
- [x] Ollama installed and running
- [ ] Pull models (nomic-embed-text, llama3.1)
- [ ] Start backend server
- [ ] Test RAG health endpoint
- [ ] Generate embeddings for providers
- [ ] Test chat/recommendation endpoints

---

## Troubleshooting

### Models won't pull

**Check:**
- Ollama is running: `curl http://localhost:11434/api/tags`
- Internet connection
- Disk space (models need ~4-8GB)

### Backend won't start

**Check:**
- Database connection in `.env` file
- Docker container is running: `docker ps`
- Port 8000 is available

### RAG endpoints return errors

**Check:**
- Ollama is running
- Models are pulled: `ollama list`
- Backend logs for errors
- Database connection

---

## Quick Command Reference

```powershell
# Pull models
ollama pull nomic-embed-text
ollama pull llama3.1

# Start backend
cd C:\FYP\backend
uvicorn main:app --reload

# Test health
curl http://localhost:8000/rag/health

# List models
ollama list

# Check Docker
docker ps
docker logs glowsense-postgres
```

---

## You're Almost Done! 🎉

Just pull the models and start your backend, then you can start using the RAG module!

**Next:** Run `ollama pull nomic-embed-text` and `ollama pull llama3.1`

