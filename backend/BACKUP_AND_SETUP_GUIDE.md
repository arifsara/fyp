# Backup with pgAdmin & Setup Docker - Step by Step

## Part 1: Backup Your Database Using pgAdmin

### Step 1: Open pgAdmin

1. Open **pgAdmin** from your Start menu
2. Connect to your PostgreSQL server (enter your password if prompted)

### Step 2: Navigate to Your Database

1. In the left sidebar, expand:
   - **Servers** → **PostgreSQL XX** → **Databases** → **glowsense_db**

### Step 3: Create Backup

1. **Right-click** on `glowsense_db`
2. Select **Backup...**
3. In the backup dialog:
   - **Filename**: Click the folder icon and choose a location (e.g., `C:\FYP\backend\backup_glowsense_db.dump`)
   - **Format**: Select **Custom** or **Plain** (Custom is recommended)
   - **Encoding**: Leave as default (UTF8)
4. Click **Backup** button
5. Wait for backup to complete (you'll see progress in the Messages tab)
6. Click **Close** when done

**✅ Backup file created!** (e.g., `backup_glowsense_db.dump`)

---

## Part 2: Stop Existing PostgreSQL Service

### Step 1: Stop PostgreSQL Service

**Method A: Using PowerShell**
```powershell
# Check what PostgreSQL services are running
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Stop the service (replace X with your version number, e.g., 16, 15, 14)
Stop-Service -Name postgresql-x64-16
```

**Method B: Using Services GUI**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find **PostgreSQL** service (e.g., "postgresql-x64-16")
4. Right-click → **Stop**

**Method C: Using Command Prompt (as Administrator)**
```powershell
net stop postgresql-x64-16
```

**✅ PostgreSQL service stopped!**

---

## Part 3: Setup Docker PostgreSQL with pgvector

### Step 1: Check Docker is Running

```powershell
docker --version
docker ps
```

If Docker is not installed:
- Download: https://www.docker.com/products/docker-desktop/
- Install and restart computer
- Make sure Docker Desktop is running

### Step 2: Run Setup Script

```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

**Wait for it to complete** - you should see:
```
✅ Docker found
✅ Docker daemon is running
✅ Container created
✅ PostgreSQL is ready!
✅ pgvector extension enabled
✅ Setup Complete!
```

**✅ Docker PostgreSQL with pgvector is ready!**

---

## Part 4: Restore Your Backup

### Step 1: Restore Using pgAdmin (Recommended)

1. Open **pgAdmin**
2. Connect to your **Docker PostgreSQL** server:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: `18220`
3. In the left sidebar, expand:
   - **Servers** → **PostgreSQL** → **Databases** → **glowsense_db**
4. **Right-click** on `glowsense_db`
5. Select **Restore...**
6. In the restore dialog:
   - **Filename**: Browse and select your backup file (e.g., `backup_glowsense_db.dump`)
   - **Format**: Select **Custom** (if you used Custom format) or **Plain**
7. Click **Restore** button
8. Wait for restore to complete
9. Click **Close** when done

**✅ Data restored!**

### Step 2: Restore Using Command Line (Alternative)

**If you have a .dump file:**
```powershell
Get-Content backup_glowsense_db.dump | docker exec -i glowsense-postgres pg_restore -U postgres -d glowsense_db
```

**If you have a .sql file:**
```powershell
Get-Content backup_glowsense_db.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

---

## Part 5: Run RAG Migration

### Step 1: Run Migration Script

```powershell
cd C:\FYP\backend
python create_rag_tables.py
```

**Expected output:**
```
Enabling pgvector extension...
✅ pgvector extension enabled
Creating chat_sessions table...
✅ chat_sessions table created
Creating user_messages table...
✅ user_messages table created
Creating indexes...
✅ Index on user_messages.user_id created
✅ Index on user_messages.session_id created
✅ Index on chat_sessions.user_id created
Adding embedding column to service_providers table...
✅ Embedding column added to service_providers
Creating vector index...
✅ Vector index created
✅ RAG tables setup complete!
```

**✅ RAG module ready!**

---

## Part 6: Verify Everything Works

### Test 1: Check Container is Running

```powershell
docker ps
```

Should show `glowsense-postgres` as running.

### Test 2: Check Your Data is There

**Using pgAdmin:**
1. Connect to Docker PostgreSQL
2. Expand `glowsense_db` → **Schemas** → **public** → **Tables**
3. You should see your existing tables (customers, service_providers, bookings, etc.)

**Using Command Line:**
```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt"
```

### Test 3: Check pgvector Extension

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

Should show `vector` in the list.

### Test 4: Check RAG Tables

```powershell
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt user_messages"
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt chat_sessions"
```

Both should show the tables exist.

### Test 5: Start Backend and Test

```powershell
cd C:\FYP\backend
uvicorn main:app --reload
```

Then in another terminal:
```powershell
curl http://localhost:8000/rag/health
```

**Expected:** `{"status":"RAG module is healthy"}`

---

## Complete Command Sequence (Copy-Paste)

```powershell
# 1. Navigate to backend
cd C:\FYP\backend

# 2. Check Docker
docker --version
docker ps

# 3. Run Docker setup
.\setup_docker_postgres.ps1

# 4. Wait for setup to complete, then run migration
python create_rag_tables.py

# 5. Verify
docker ps
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

**Then restore your backup using pgAdmin (see Part 4 above).**

---

## Troubleshooting

### Issue: Can't connect to Docker PostgreSQL in pgAdmin

**Check:**
1. Container is running: `docker ps`
2. Port is correct: `localhost:5432`
3. Password is: `18220`
4. Database name is: `glowsense_db`

### Issue: Restore fails in pgAdmin

**Try:**
1. Make sure you selected the correct format (Custom or Plain)
2. Try command line restore instead
3. Check backup file is not corrupted

### Issue: Data not showing after restore

**Check:**
1. Restore completed successfully (check Messages tab in pgAdmin)
2. You're connected to the correct database (`glowsense_db`)
3. Refresh the tables list in pgAdmin

### Issue: Migration fails

**Check:**
1. pgvector extension is enabled: `docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"`
2. Container is running: `docker ps`
3. Database connection is working

---

## Summary Checklist

- [ ] ✅ Backed up database using pgAdmin
- [ ] ✅ Stopped existing PostgreSQL service
- [ ] ✅ Docker Desktop is running
- [ ] ✅ Ran `.\setup_docker_postgres.ps1`
- [ ] ✅ Restored backup using pgAdmin
- [ ] ✅ Ran `python create_rag_tables.py`
- [ ] ✅ Verified data is present
- [ ] ✅ Verified pgvector extension
- [ ] ✅ Tested backend server

**All done! Your PostgreSQL with pgvector is ready with all your data!** 🎉

