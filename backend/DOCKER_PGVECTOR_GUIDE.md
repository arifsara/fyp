# Docker with pgvector - Complete Guide

## 🚀 Quick Setup (Automated)

### Step 1: Run the Setup Script

```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

This script will:
- ✅ Check if Docker is running
- ✅ Stop and remove old container (if exists)
- ✅ Download and run `pgvector/pgvector:pg16` image
- ✅ Enable pgvector extension automatically
- ✅ Verify everything works

**That's it!** The script does everything for you.

---

## 📋 Manual Setup (Step-by-Step)

If you prefer to do it manually:

### Step 1: Check Current Docker Containers

```powershell
docker ps -a
```

### Step 2: Stop and Remove Old Container (if exists)

```powershell
# Stop container
docker stop glowsense-postgres

# Remove container
docker rm glowsense-postgres
```

**⚠️ Important:** If you have data you want to keep, backup first:
```powershell
docker exec glowsense-postgres pg_dump -U postgres glowsense_db > backup.sql
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

**What this does:**
- `-d` = Run in background (detached mode)
- `--name glowsense-postgres` = Container name
- `-e POSTGRES_PASSWORD=18220` = Database password
- `-e POSTGRES_DB=glowsense_db` = Database name
- `-e POSTGRES_USER=postgres` = Database user
- `-p 5432:5432` = Port mapping (host:container)
- `--restart unless-stopped` = Auto-restart on reboot
- `pgvector/pgvector:pg16` = Image with pgvector pre-installed

### Step 4: Wait for PostgreSQL to Start

```powershell
# Check logs
docker logs glowsense-postgres

# Wait until you see: "database system is ready to accept connections"
```

### Step 5: Enable pgvector Extension

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 6: Verify It Works

```powershell
# Test pgvector
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "SELECT vector('[1,2,3]');"
```

Should return: `[1,2,3]`

---

## 🔌 Connect from pgAdmin

### Connection Settings:

- **Host:** `localhost` (or `127.0.0.1`)
- **Port:** `5432`
- **Database:** `glowsense_db`
- **Username:** `postgres`
- **Password:** `18220`

### Steps:

1. Open pgAdmin
2. Right-click **Servers** → **Create** → **Server**
3. **General Tab:**
   - Name: `Docker PostgreSQL`
4. **Connection Tab:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `glowsense_db`
   - Username: `postgres`
   - Password: `18220`
5. Click **Save**

---

## ✅ Verify pgvector in pgAdmin

1. Connect to `Docker PostgreSQL` server
2. Expand: `Databases` → `glowsense_db` → **Query Tool**
3. Run:

```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test pgvector
SELECT vector('[1,2,3]');
```

Both should work!

---

## 🛠️ Useful Docker Commands

### View Container Status
```powershell
docker ps
```

### View Logs
```powershell
docker logs glowsense-postgres
```

### Stop Container
```powershell
docker stop glowsense-postgres
```

### Start Container
```powershell
docker start glowsense-postgres
```

### Access PostgreSQL Shell
```powershell
docker exec -it glowsense-postgres psql -U postgres -d glowsense_db
```

### Backup Database
```powershell
docker exec glowsense-postgres pg_dump -U postgres glowsense_db > backup.sql
```

### Restore Database
```powershell
Get-Content backup.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

### Remove Container (⚠️ Deletes data!)
```powershell
docker stop glowsense-postgres
docker rm glowsense-postgres
```

---

## 🐛 Troubleshooting

### Issue: "Port 5432 is already in use"

**Solution:**
```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# Stop your local PostgreSQL service
Stop-Service -Name postgresql-x64-16
# Or change Docker port mapping to 5433
```

### Issue: "Container name already exists"

**Solution:**
```powershell
docker stop glowsense-postgres
docker rm glowsense-postgres
# Then run setup again
```

### Issue: "Cannot connect to Docker daemon"

**Solution:**
- Make sure Docker Desktop is running
- Check: `docker ps` should work

### Issue: "Extension vector is not available"

**Solution:**
- Make sure you're using `pgvector/pgvector:pg16` image
- Check: `docker ps` should show `pgvector/pgvector:pg16` in IMAGE column

### Issue: "Connection refused"

**Solution:**
```powershell
# Check if container is running
docker ps

# Check logs
docker logs glowsense-postgres

# Wait a bit longer for PostgreSQL to start
```

---

## 📝 Next Steps After Setup

1. **Run database setup:**
   ```powershell
   cd C:\FYP\backend
   # In pgAdmin Query Tool, run setup_rag_database.sql
   ```

2. **Generate embeddings:**
   ```powershell
   python generate_all_embeddings.py
   ```

3. **Start backend:**
   ```powershell
   uvicorn main:app --reload
   ```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Setup | `.\setup_docker_postgres.ps1` |
| Start | `docker start glowsense-postgres` |
| Stop | `docker stop glowsense-postgres` |
| Logs | `docker logs glowsense-postgres` |
| Access DB | `docker exec -it glowsense-postgres psql -U postgres -d glowsense_db` |
| Backup | `docker exec glowsense-postgres pg_dump -U postgres glowsense_db > backup.sql` |

---

**Your Docker PostgreSQL with pgvector is ready!** 🚀

