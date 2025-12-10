# Next Steps After Backup - Complete Guide

## ✅ Step 1: Backup Complete!

You've created: `C:\FYP\backend\backup_glowsense_db.dump`

---

## Step 2: Stop Existing PostgreSQL Service

### Option A: Using PowerShell (Recommended)

```powershell
# Check what PostgreSQL services are running
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Stop the service (replace 16 with your version if different)
Stop-Service -Name postgresql-x64-16
```

**Or if you don't know the exact name:**
```powershell
# Find and stop PostgreSQL service
Get-Service | Where-Object {$_.Name -like "*postgres*"} | Stop-Service
```

### Option B: Using Services GUI

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find **PostgreSQL** service (e.g., "postgresql-x64-16")
4. Right-click → **Stop**

### Option C: Using Command Prompt (as Administrator)

```powershell
net stop postgresql-x64-16
```

**✅ PostgreSQL service stopped!**

---

## Step 3: Run Docker Setup Script

```powershell
# Make sure you're in the backend directory
cd C:\FYP\backend

# Run the setup script
.\setup_docker_postgres.ps1
```

**What this does:**
- Creates PostgreSQL container with pgvector
- Sets up the database
- Enables pgvector extension
- Verifies everything works

**Wait for completion** - you should see:
```
✅ Docker found
✅ Docker daemon is running
✅ Container created
✅ PostgreSQL is ready!
✅ pgvector extension enabled
✅ Setup Complete!
```

**✅ Docker PostgreSQL is ready!**

---

## Step 4: Restore Your Backup to Docker PostgreSQL

### Using pgAdmin (Recommended)

1. **Open pgAdmin**

2. **Add Docker PostgreSQL Server:**
   - Right-click on **Servers** (in left sidebar)
   - Click **Register** → **Server**
   - **General tab:**
     - Name: `Docker PostgreSQL` (any name you want)
   - **Connection tab:**
     - Host name/address: `localhost`
     - Port: `5432`
     - Maintenance database: `postgres`
     - Username: `postgres`
     - Password: `18220`
   - Click **Save**

3. **Connect to Docker PostgreSQL:**
   - Click on the new server in the left sidebar
   - Enter password: `18220` if prompted
   - Expand: **Servers** → **Docker PostgreSQL** → **Databases** → **glowsense_db**
   - **Note:** The `glowsense_db` database is created automatically by the Docker setup script - you don't need to create it manually!

4. **Restore the Backup:**
   - Right-click on `glowsense_db`
   - Click **Restore...**
   - **General tab:**
     - Filename: Click folder icon (📁)
     - Navigate to: `C:\FYP\backend\`
     - Select: `backup_glowsense_db.dump`
     - Format: Select **Custom** (same as backup format)
   - Click **Restore** button
   - Wait for completion (watch Messages tab)
   - Click **Close** when done

**✅ Data restored to Docker PostgreSQL!**

---

## Step 5: Run RAG Migration Script

```powershell
# Make sure you're in backend directory
cd C:\FYP\backend

# Run the migration
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

**✅ RAG module is ready!**

---

## Step 6: Verify Everything Works

### Test 1: Check Container is Running

```powershell
docker ps
```

Should show `glowsense-postgres` as running.

### Test 2: Check Your Data is Restored

**In pgAdmin:**
- Connect to Docker PostgreSQL
- Expand: `glowsense_db` → **Schemas** → **public** → **Tables**
- You should see your existing tables (customers, service_providers, bookings, etc.)

**Or using command line:**
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

Then in another terminal or browser:
```powershell
curl http://localhost:8000/rag/health
```

**Expected:** `{"status":"RAG module is healthy"}`

---

## Complete Command Sequence (Copy-Paste)

```powershell
# 1. Stop PostgreSQL service
Get-Service | Where-Object {$_.Name -like "*postgres*"} | Stop-Service

# 2. Navigate to backend
cd C:\FYP\backend

# 3. Run Docker setup
.\setup_docker_postgres.ps1

# 4. Wait for setup to complete, then run migration
python create_rag_tables.py

# 5. Verify
docker ps
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

**Then restore backup in pgAdmin (see Step 4 above).**

---

## Troubleshooting

### Issue: Can't stop PostgreSQL service
**Fix:** 
- Run PowerShell as Administrator
- Or use Services GUI (services.msc)

### Issue: Docker setup fails
**Fix:**
- Make sure Docker Desktop is running
- Check: `docker ps` should work
- Check port 5432 is free: `netstat -ano | findstr :5432`

### Issue: Can't connect to Docker PostgreSQL in pgAdmin
**Fix:**
- Check container is running: `docker ps`
- Check connection details:
  - Host: `localhost`
  - Port: `5432`
  - Username: `postgres`
  - Password: `18220`

### Issue: Restore fails
**Fix:**
- Make sure you selected **Custom** format (same as backup)
- Check backup file exists: `dir C:\FYP\backend\backup_glowsense_db.dump`
- Try command line restore (see alternative method below)

---

## Alternative: Restore Using Command Line

If pgAdmin restore doesn't work:

```powershell
# For .dump file (Custom format)
Get-Content C:\FYP\backend\backup_glowsense_db.dump | docker exec -i glowsense-postgres pg_restore -U postgres -d glowsense_db

# For .sql file (Plain format)
Get-Content C:\FYP\backend\backup_glowsense_db.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

---

## Summary Checklist

- [x] ✅ Backup created
- [ ] ⬜ Stop PostgreSQL service
- [ ] ⬜ Run Docker setup script
- [ ] ⬜ Restore backup to Docker PostgreSQL
- [ ] ⬜ Run migration script
- [ ] ⬜ Verify data is restored
- [ ] ⬜ Verify pgvector extension
- [ ] ⬜ Test backend server

---

**You're doing great! Continue with Step 2 (stop PostgreSQL service).** 🚀

