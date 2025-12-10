# Setting Up PostgreSQL with pgvector using Docker (Windows)

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download: https://www.docker.com/products/docker-desktop/
   - Make sure Docker Desktop is running (check system tray)

## Step-by-Step Setup

### Step 1: Check Docker Installation

```powershell
docker --version
```

If you see a version number, Docker is installed. If not, install Docker Desktop first.

### Step 2: Stop Existing PostgreSQL (If Running)

**If you have PostgreSQL running as a Windows service:**

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Stop the service (replace X with your version number)
Stop-Service -Name postgresql-x64-16
# OR
net stop postgresql-x64-16
```

**Or stop it from Services:**
- Press `Win + R`, type `services.msc`
- Find PostgreSQL service
- Right-click → Stop

### Step 3: Backup Your Database (Important!)

**Before switching to Docker, backup your existing data:**

```powershell
# Navigate to backend directory
cd C:\FYP\backend

# Create backup (adjust connection details)
pg_dump -U postgres -d glowsense_db -F c -f backup_glowsense_db.dump
```

**Or use pgAdmin:**
- Right-click on `glowsense_db` → Backup
- Save the backup file

### Step 4: Remove Existing PostgreSQL Container (If Exists)

```powershell
# Check if container exists
docker ps -a | findstr postgres

# Stop and remove if exists
docker stop glowsense-postgres
docker rm glowsense-postgres
```

### Step 5: Create Docker Container with pgvector

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
- Creates a container named `glowsense-postgres`
- Sets PostgreSQL password to `18220`
- Creates database `glowsense_db`
- Maps port 5432 (same as your current setup)
- Uses pgvector image with PostgreSQL 16

### Step 6: Verify Container is Running

```powershell
# Check container status
docker ps

# Check logs
docker logs glowsense-postgres
```

You should see the container running and PostgreSQL started.

### Step 7: Test pgvector Extension

```powershell
# Connect to the database
docker exec -it glowsense-postgres psql -U postgres -d glowsense_db

# In psql, run:
CREATE EXTENSION vector;
SELECT vector('[1,2,3]');
\q
```

If you see `[1,2,3]`, pgvector is working!

### Step 8: Restore Your Data (If You Had Existing Data)

```powershell
# Restore from backup
docker exec -i glowsense-postgres pg_restore -U postgres -d glowsense_db < backup_glowsense_db.dump

# OR if you have a SQL dump:
docker exec -i glowsense-postgres psql -U postgres -d glowsense_db < backup.sql
```

**If you're starting fresh, skip this step.**

### Step 9: Run RAG Migration Script

```powershell
# Make sure you're in backend directory
cd C:\FYP\backend

# Run the migration
python create_rag_tables.py
```

You should now see:
```
✅ pgvector extension enabled
✅ chat_sessions table created
✅ user_messages table created
✅ Embedding column added to service_providers
✅ Vector index created
```

### Step 10: Verify Everything Works

```powershell
# Test connection
docker exec -it glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

You should see `vector` in the list of extensions.

## Quick Setup Script (All-in-One)

Save this as `setup_docker_postgres.ps1`:

```powershell
# Stop existing container if exists
docker stop glowsense-postgres 2>$null
docker rm glowsense-postgres 2>$null

# Create new container
Write-Host "Creating PostgreSQL container with pgvector..."
docker run -d `
  --name glowsense-postgres `
  -e POSTGRES_PASSWORD=18220 `
  -e POSTGRES_DB=glowsense_db `
  -e POSTGRES_USER=postgres `
  -p 5432:5432 `
  --restart unless-stopped `
  pgvector/pgvector:pg16

# Wait for PostgreSQL to start
Write-Host "Waiting for PostgreSQL to start..."
Start-Sleep -Seconds 5

# Enable pgvector extension
Write-Host "Enabling pgvector extension..."
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

Write-Host "✅ Setup complete!"
Write-Host "Run: python create_rag_tables.py"
```

Run it:
```powershell
.\setup_docker_postgres.ps1
```

## Troubleshooting

### Container won't start
```powershell
# Check logs
docker logs glowsense-postgres

# Check if port 5432 is in use
netstat -ano | findstr :5432
```

### Can't connect to database
- Make sure Docker Desktop is running
- Check container is running: `docker ps`
- Verify port mapping: `docker port glowsense-postgres`

### Extension still not available
```powershell
# Connect and check
docker exec -it glowsense-postgres psql -U postgres -d glowsense_db
# Then run:
\dx
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

### Need to access database from outside Docker
Your `.env` file should have:
```
DATABASE_URL=postgresql://postgres:18220@localhost:5432/glowsense_db
```

This works because Docker maps port 5432 to localhost.

## Useful Docker Commands

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

# Remove container (careful - deletes data!)
docker stop glowsense-postgres
docker rm glowsense-postgres
```

## Next Steps

After setup:
1. ✅ Run `python create_rag_tables.py`
2. ✅ Start your backend: `uvicorn main:app --reload`
3. ✅ Test RAG endpoints
4. ✅ Install Ollama and pull models

---

**Your PostgreSQL with pgvector is now ready!** 🎉

