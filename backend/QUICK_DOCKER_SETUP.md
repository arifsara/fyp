# Quick Docker Setup with pgvector

## ⚠️ Prerequisites

1. **Docker Desktop must be installed and running**
   - Download: https://www.docker.com/products/docker-desktop/
   - Make sure Docker Desktop is **running** (you'll see the Docker icon in system tray)

## 🚀 Quick Start (3 Steps)

### Step 1: Start Docker Desktop

- Open Docker Desktop application
- Wait until it shows "Docker Desktop is running"
- You'll see a whale icon in your system tray

### Step 2: Run Setup Script

Open PowerShell and run:

```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

**What happens:**
- Downloads `pgvector/pgvector:pg16` image (first time only, ~500MB)
- Creates container with PostgreSQL + pgvector
- Enables pgvector extension automatically
- Verifies everything works

**Time:** 2-5 minutes (first time), 30 seconds (subsequent runs)

### Step 3: Verify in pgAdmin

1. Open pgAdmin
2. Connect to: `localhost:5432` (user: `postgres`, password: `18220`)
3. Run in Query Tool:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
4. Should return 1 row ✅

---

## 📋 Manual Setup (If Script Doesn't Work)

### Step 1: Check Docker is Running

```powershell
docker ps
```

If you get an error, start Docker Desktop first.

### Step 2: Stop Old Container (if exists)

```powershell
docker stop glowsense-postgres
docker rm glowsense-postgres
```

### Step 3: Run PostgreSQL with pgvector

```powershell
docker run -d `
  --name glowsense-postgres `
  -e POSTGRES_PASSWORD=18220 `
  -e POSTGRES_DB=glowsense_db `
  -e POSTGRES_USER=postgres `
  -p 5432:5432 `
  --restart unless-stopped `
  pgvector/pgvector:pg16
```

### Step 4: Wait for Startup

```powershell
# Check logs
docker logs glowsense-postgres

# Wait until you see: "database system is ready to accept connections"
```

### Step 5: Enable pgvector

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 6: Verify

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "SELECT vector('[1,2,3]');"
```

Should return: `[1,2,3]`

---

## ✅ Success Checklist

- [ ] Docker Desktop is running
- [ ] Container is running: `docker ps` shows `glowsense-postgres`
- [ ] Can connect in pgAdmin
- [ ] pgvector extension enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns 1 row
- [ ] Can run: `SELECT vector('[1,2,3]');` successfully

---

## 🐛 Common Issues

### "Docker daemon is not running"
**Fix:** Start Docker Desktop application

### "Port 5432 is already in use"
**Fix:** 
```powershell
# Stop local PostgreSQL
Stop-Service -Name postgresql-x64-16
# Or use different port: -p 5433:5432
```

### "Cannot connect to database"
**Fix:** Wait a bit longer, PostgreSQL takes 10-30 seconds to start

---

## 🎯 After Setup

1. **Run database setup SQL** in pgAdmin (from `setup_rag_database.sql`)
2. **Generate embeddings:** `python generate_all_embeddings.py`
3. **Start backend:** `uvicorn main:app --reload`

---

**Need help?** Check `DOCKER_PGVECTOR_GUIDE.md` for detailed instructions.

