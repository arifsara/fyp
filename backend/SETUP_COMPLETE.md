# 🎉 RAG Module Setup Complete!

## ✅ What's Been Done

1. ✅ **Backup created** from old PostgreSQL
2. ✅ **PostgreSQL service stopped**
3. ✅ **Docker PostgreSQL with pgvector** set up
4. ✅ **Backup restored** to Docker PostgreSQL
5. ✅ **RAG migration completed:**
   - pgvector extension enabled
   - chat_sessions table created
   - user_messages table created
   - embedding column added to service_providers
   - vector indexes created

---

## 🧪 Verify Everything Works

### Test 1: Check pgvector Extension

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

Should show `vector` in the list.

### Test 2: Check RAG Tables

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt user_messages"
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt chat_sessions"
```

Both should show the tables exist.

### Test 3: Check Your Data is There

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt"
```

Should show all your tables (customers, service_providers, bookings, payments, etc.).

### Test 4: Start Backend and Test RAG

```powershell
cd C:\FYP\backend
uvicorn main:app --reload
```

Then in another terminal or browser:
```powershell
curl http://localhost:8000/rag/health
```

**Expected:** `{"status":"RAG module is healthy"}`

---

## 📋 Next Steps: Install Ollama

### Step 1: Download Ollama

1. Visit: https://ollama.ai/download
2. Download Ollama for Windows
3. Install it

### Step 2: Start Ollama Server

Open a **new terminal** (any directory):

```powershell
ollama serve
```

Keep this terminal open - Ollama needs to keep running.

### Step 3: Pull Required Models

Open **another new terminal**:

```powershell
# Pull embedding model
ollama pull nomic-embed-text

# Pull LLM model
ollama pull llama3.1
```

This will download the models (may take a few minutes).

### Step 4: Verify Ollama is Working

```powershell
ollama list
```

Should show both models:
- `nomic-embed-text`
- `llama3.1`

---

## 🚀 Start Using RAG Module

### Start Backend Server

```powershell
cd C:\FYP\backend
uvicorn main:app --reload
```

### Test RAG Endpoints

#### Health Check:
```powershell
curl http://localhost:8000/rag/health
```

#### Test Chat:
```powershell
curl -X POST "http://localhost:8000/rag/chat" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"message": "Find me a makeup artist"}'
```

#### Test Recommendation:
```powershell
curl -X POST "http://localhost:8000/rag/recommend" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"query": "I need a hairstylist in my city"}'
```

---

## 📊 Summary

### ✅ Completed:
- [x] Database backup
- [x] Docker PostgreSQL setup
- [x] Data restoration
- [x] RAG tables creation
- [x] pgvector extension enabled

### ⬜ Remaining:
- [ ] Install Ollama
- [ ] Pull models (nomic-embed-text, llama3.1)
- [ ] Start backend server
- [ ] Test RAG endpoints
- [ ] Generate embeddings for existing providers

---

## 🔧 Useful Commands

### Docker PostgreSQL:
```powershell
# Start container
docker start glowsense-postgres

# Stop container
docker stop glowsense-postgres

# View logs
docker logs glowsense-postgres

# Access PostgreSQL shell
docker exec -it glowsense-postgres psql -U postgres -d glowsense_db
```

### Ollama:
```powershell
# Start server
ollama serve

# List models
ollama list

# Pull model
ollama pull model-name

# Test model
ollama run llama3.1 "Hello, how are you?"
```

---

## 🎯 You're All Set!

Your RAG module is ready to use. Just install Ollama and pull the models to start using AI-powered provider recommendations!

**Great job completing the setup!** 🎉

