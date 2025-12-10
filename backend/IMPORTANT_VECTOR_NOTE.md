# Important: About pgvector Extension

## Why You Don't See "vector" Extension

**This is NORMAL and EXPECTED!** 

Your current PostgreSQL installation doesn't have pgvector installed. That's exactly why we're switching to Docker - the Docker image comes with pgvector pre-installed.

## The Process

### Current Situation:
- ❌ Your current PostgreSQL: **No pgvector** (that's why you don't see it)
- ✅ Docker PostgreSQL: **Has pgvector** (will be available after setup)

### What to Do:

1. **First**: Backup your data from the OLD PostgreSQL (the one without pgvector)
   - This is just to save your data
   - Don't worry about pgvector here - it's not needed for backup

2. **Second**: Set up Docker PostgreSQL (this WILL have pgvector)
   - The Docker image `pgvector/pgvector:pg16` comes with pgvector pre-installed
   - After setup, pgvector will be available

3. **Third**: Restore your backup to Docker PostgreSQL
   - Your data will be in the new PostgreSQL (with pgvector)

4. **Fourth**: Run migration script
   - This will enable pgvector extension in Docker PostgreSQL
   - Then you'll see "vector" in the extensions list

## Step-by-Step (Corrected)

### Step 1: Backup from OLD PostgreSQL (No pgvector needed here)
- Just backup your data using pgAdmin
- Don't look for pgvector - it's not there and that's okay!

### Step 2: Stop OLD PostgreSQL
```powershell
Stop-Service -Name postgresql-x64-16
```

### Step 3: Set up Docker PostgreSQL (This WILL have pgvector)
```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

### Step 4: Restore to Docker PostgreSQL
- Connect to Docker PostgreSQL in pgAdmin
- Restore your backup

### Step 5: Check pgvector in Docker PostgreSQL
After setup, in pgAdmin:
1. Connect to **Docker PostgreSQL** server (not the old one!)
2. Right-click on `glowsense_db` → **Query Tool**
3. Run: `SELECT * FROM pg_available_extensions WHERE name = 'vector';`
4. You should see the vector extension!

### Step 6: Run Migration (This enables pgvector)
```powershell
python create_rag_tables.py
```

This will:
- Enable the pgvector extension in Docker PostgreSQL
- Create RAG tables
- Add embedding column

### Step 7: Verify pgvector is Enabled
In pgAdmin, connected to **Docker PostgreSQL**:
1. Right-click on `glowsense_db` → **Query Tool**
2. Run: `\dx` or `SELECT * FROM pg_extension WHERE extname = 'vector';`
3. You should see `vector` in the list!

## Key Points

✅ **Don't worry** about pgvector in your old PostgreSQL - it's not there and that's fine!

✅ **Docker PostgreSQL** will have pgvector automatically

✅ **After Docker setup**, you'll see pgvector in the Docker PostgreSQL instance

✅ **After migration**, pgvector will be enabled and ready to use

## Quick Check Commands

After Docker setup, verify pgvector:

```powershell
# Check if pgvector is available
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"

# After migration, check if it's enabled
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dx"
```

You should see `vector` in the results!

---

**TL;DR: Your old PostgreSQL doesn't have pgvector (that's normal). Docker PostgreSQL will have it. Just follow the backup → Docker setup → restore → migration steps!**

