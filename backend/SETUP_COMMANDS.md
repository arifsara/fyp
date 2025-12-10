# Clear Setup Commands - Step by Step

## Prerequisites Check

### 1. Check if Docker is installed and running

```powershell
docker --version
docker ps
```

**If Docker is NOT installed:**
- Download: https://www.docker.com/products/docker-desktop/
- Install Docker Desktop
- Restart your computer
- Make sure Docker Desktop is running (check system tray)

---

## Option A: Starting Fresh (No Existing Data to Backup)

### Step 1: Run the Automated Setup Script

```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

**Wait for it to complete** - it will:
- Create PostgreSQL container with pgvector
- Enable the extension
- Verify everything works

### Step 2: Run Database Migration

```powershell
python create_rag_tables.py
```

**Expected output:**
```
✅ pgvector extension enabled
✅ chat_sessions table created
✅ user_messages table created
✅ Embedding column added to service_providers
✅ Vector index created
```

### Step 3: Done! ✅

Your PostgreSQL with pgvector is ready!

---

## Option B: You Have Existing Data to Backup

### Step 1: Find pg_dump (if you have PostgreSQL installed)

**Method 1: Find PostgreSQL installation**
```powershell
# Common locations - check if these exist:
Test-Path "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
Test-Path "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
Test-Path "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
```

**If found, use full path:**
```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -d glowsense_db -F c -f backup.dump
```

**Method 2: Use Docker to backup (if you have old PostgreSQL in Docker)**
```powershell
docker exec <old-container-name> pg_dump -U postgres glowsense_db > backup.sql
```

**Method 3: Use pgAdmin (GUI)**
- Open pgAdmin
- Right-click on `glowsense_db` → Backup
- Save as `backup.dump` or `backup.sql`

### Step 2: Stop Existing PostgreSQL Service

```powershell
# Check what's running
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Stop the service (replace X with your version)
Stop-Service -Name postgresql-x64-16
# OR
net stop postgresql-x64-16
```

**Or use Services GUI:**
- Press `Win + R`, type `services.msc`
- Find PostgreSQL service → Right-click → Stop

### Step 3: Run Docker Setup

```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

### Step 4: Restore Your Data (if you backed it up)

**If you have a .dump file:**
```powershell
docker exec -i glowsense-postgres pg_restore -U postgres -d glowsense_db < backup.dump
```

**If you have a .sql file:**
```powershell
Get-Content backup.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

### Step 5: Run Migration

```powershell
python create_rag_tables.py
```

---

## Manual Docker Setup (If Script Doesn't Work)

### Step 1: Stop and Remove Old Container (if exists)

```powershell
docker stop glowsense-postgres
docker rm glowsense-postgres
```

### Step 2: Create New Container

```powershell
docker run -d --name glowsense-postgres -e POSTGRES_PASSWORD=18220 -e POSTGRES_DB=glowsense_db -e POSTGRES_USER=postgres -p 5432:5432 --restart unless-stopped pgvector/pgvector:pg16
```

### Step 3: Wait 10 seconds, then check status

```powershell
docker ps
docker logs glowsense-postgres
```

### Step 4: Enable pgvector

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "CREATE EXTENSION vector;"
```

### Step 5: Verify pgvector works

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "SELECT vector('[1,2,3]');"
```

**Expected output:** `[1,2,3]`

### Step 6: Run Migration

```powershell
python create_rag_tables.py
```

---

## Verify Everything Works

### Test 1: Check Container is Running

```powershell
docker ps
```

Should show `glowsense-postgres` as running.

### Test 2: Check pgvector Extension

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

Should show `vector` in the list.

### Test 3: Check Tables Created

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt"
```

Should show `user_messages` and `chat_sessions` tables.

### Test 4: Start Backend and Test

```powershell
uvicorn main:app --reload
```

Then test:
```powershell
curl http://localhost:8000/rag/health
```

**Expected:** `{"status":"RAG module is healthy"}`

---

## Common Issues & Fixes

### Issue: "Docker is not running"
**Fix:** Start Docker Desktop from Start menu

### Issue: "Port 5432 is already in use"
**Fix:** Stop existing PostgreSQL service (see Step 2 in Option B)

### Issue: "Container name already exists"
**Fix:** 
```powershell
docker stop glowsense-postgres
docker rm glowsense-postgres
```
Then run setup again.

### Issue: "Cannot connect to database"
**Fix:** 
1. Check container is running: `docker ps`
2. Check logs: `docker logs glowsense-postgres`
3. Wait a bit longer (PostgreSQL takes time to start)

---

## Quick Reference Commands

```powershell
# Start container
docker start glowsense-postgres

# Stop container
docker stop glowsense-postgres

# View logs
docker logs glowsense-postgres

# Access PostgreSQL shell
docker exec -it glowsense-postgres psql -U postgres -d glowsense_db

# Backup database
docker exec glowsense-postgres pg_dump -U postgres glowsense_db > backup.sql

# Check container status
docker ps -a
```

---

## Next Steps After Setup

1. ✅ Run `python create_rag_tables.py`
2. ✅ Start backend: `uvicorn main:app --reload`
3. ✅ Install Ollama: https://ollama.ai/download
4. ✅ Pull models:
   ```powershell
   ollama pull nomic-embed-text
   ollama pull llama3.1
   ```
5. ✅ Test RAG endpoints

---

**All commands are ready to copy-paste!** 🚀

