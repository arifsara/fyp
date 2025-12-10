# RAG Module Setup Instructions - Directory Guide

## 📍 Where to Install Everything

### 1. Python Dependencies (Backend Directory)

**Location:** `C:\FYP\backend`

```powershell
# Navigate to backend directory
cd C:\FYP\backend

# Install Python packages
pip install httpx pgvector
```

**OR** if using `uv` (as per your project setup):

```powershell
cd C:\FYP\backend
uv add httpx pgvector
```

---

### 2. PostgreSQL pgvector Extension (Database)

**Location:** PostgreSQL database (not a directory, but database-level)

**Method 1: Using psql (Command Line)**

```powershell
# Connect to PostgreSQL
psql -U postgres -d glowsense_db

# Then run in psql:
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

**Method 2: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Navigate to: `Servers` → `Your Server` → `Databases` → `glowsense_db` → `Extensions`
4. Right-click → `Create` → `Extension`
5. Select `vector` from the dropdown
6. Click `Save`

**Method 3: If pgvector is not installed on your system**

You may need to install pgvector extension first:

**On Windows:**
- Download pre-built binaries or compile from source
- Or use a PostgreSQL distribution that includes pgvector (like Postgres.app alternatives)

**On Linux/WSL:**
```bash
sudo apt-get install postgresql-14-pgvector
# or for your PostgreSQL version
```

---

### 3. Database Migration Script

**Location:** `C:\FYP\backend`

```powershell
# Navigate to backend directory
cd C:\FYP\backend

# Run the migration script
python create_rag_tables.py
```

This will:
- Enable pgvector extension (if not already enabled)
- Create `user_messages` table
- Create `chat_sessions` table
- Add `embedding` column to `service_providers` table
- Create indexes

---

### 4. Ollama Installation (System-Wide)

**Location:** System-wide installation (not project-specific)

**Download and Install Ollama:**
1. Visit: https://ollama.ai/download
2. Download Ollama for Windows
3. Install it (it will be available system-wide)

**Start Ollama Server:**
```powershell
# Open a NEW terminal (any directory)
ollama serve
```

**Pull Required Models (in a NEW terminal):**
```powershell
# Can run from any directory
ollama pull nomic-embed-text
ollama pull llama3.1
```

**Verify Installation:**
```powershell
# Check if Ollama is running
ollama list
```

---

### 5. Environment Variables (Optional)

**Location:** `C:\FYP\backend\.env`

Add these to your existing `.env` file (or create if doesn't exist):

```env
# Ollama Configuration (optional - defaults provided)
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.1
```

---

## 📋 Complete Setup Checklist

### Step 1: Install Python Dependencies
```powershell
cd C:\FYP\backend
pip install httpx pgvector
# OR
uv add httpx pgvector
```

### Step 2: Enable pgvector Extension in PostgreSQL
```sql
-- Connect to your database
psql -U postgres -d glowsense_db

-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3: Run Database Migration
```powershell
cd C:\FYP\backend
python create_rag_tables.py
```

### Step 4: Install and Start Ollama
1. Download from https://ollama.ai/download
2. Install Ollama
3. Start server: `ollama serve` (in any terminal)
4. Pull models (in new terminal):
   ```powershell
   ollama pull nomic-embed-text
   ollama pull llama3.1
   ```

### Step 5: Restart Backend Server
```powershell
cd C:\FYP\backend
uvicorn main:app --reload
```

---

## 🧪 Testing

**Location:** `C:\FYP\backend` (or use Postman/curl from anywhere)

### Test Health Endpoint
```powershell
# From any directory
curl http://localhost:8000/rag/health
```

### Test Embedding
```powershell
curl -X POST "http://localhost:8000/rag/embed" `
  -H "Content-Type: application/json" `
  -d '{\"text\": \"makeup artist\"}'
```

---

## 📁 Directory Summary

| Item | Directory | Notes |
|------|-----------|-------|
| Python packages | `C:\FYP\backend` | Install here |
| Database migration | `C:\FYP\backend` | Run script from here |
| Backend server | `C:\FYP\backend` | Start from here |
| Ollama | System-wide | Install globally |
| .env file | `C:\FYP\backend\.env` | Add config here |
| RAG module code | `C:\FYP\backend\rag\` | Already created ✅ |
| Services code | `C:\FYP\backend\services\` | Already created ✅ |
| LLM code | `C:\FYP\backend\llm\` | Already created ✅ |

---

## ⚠️ Troubleshooting

### "pgvector extension not found"
- Make sure PostgreSQL has pgvector installed
- Run: `CREATE EXTENSION vector;` in your database

### "Ollama connection refused"
- Make sure Ollama is running: `ollama serve`
- Check if port 11434 is available

### "Module not found" errors
- Make sure you're in `C:\FYP\backend` directory
- Install dependencies: `pip install httpx pgvector`

### "Import errors"
- Restart the backend server after installing packages
- Make sure all files are in correct directories

---

## ✅ Quick Start (All Commands)

```powershell
# 1. Install Python dependencies
cd C:\FYP\backend
pip install httpx pgvector

# 2. Enable pgvector (in psql)
psql -U postgres -d glowsense_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. Run migration
python create_rag_tables.py

# 4. Install Ollama (download from https://ollama.ai)
# Then in separate terminals:
ollama serve
ollama pull nomic-embed-text
ollama pull llama3.1

# 5. Restart backend
uvicorn main:app --reload
```

---

**All set! The RAG module is ready to use.** 🎉

