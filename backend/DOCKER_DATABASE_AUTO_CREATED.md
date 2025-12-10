# Docker Database is Created Automatically

## ✅ No Need to Create Database Manually!

The Docker setup script **automatically creates** the `glowsense_db` database when the container starts.

## How It Works

When you run `.\setup_docker_postgres.ps1`, it creates a Docker container with this command:

```powershell
docker run -d `
  --name glowsense-postgres `
  -e POSTGRES_PASSWORD=18220 `
  -e POSTGRES_DB=glowsense_db `    ← This creates the database automatically!
  -e POSTGRES_USER=postgres `
  -p 5432:5432 `
  --restart unless-stopped `
  pgvector/pgvector:pg16
```

The `-e POSTGRES_DB=glowsense_db` parameter tells PostgreSQL to **automatically create** the database when the container first starts.

## What You'll See

After running the setup script:

1. **In pgAdmin:**
   - Connect to Docker PostgreSQL server
   - Expand: **Servers** → **Docker PostgreSQL** → **Databases**
   - You'll see `glowsense_db` already there! ✅

2. **Using Command Line:**
   ```powershell
   docker exec glowsense-postgres psql -U postgres -l
   ```
   You'll see `glowsense_db` in the list.

## What You Need to Do

### ✅ After Docker Setup:
1. Connect to Docker PostgreSQL in pgAdmin
2. The `glowsense_db` database will already exist
3. Just restore your backup to it

### ❌ You DON'T Need To:
- Create the database manually
- Run CREATE DATABASE command
- Do anything extra - it's already there!

## Step-by-Step After Docker Setup

1. **Open pgAdmin**
2. **Add Docker PostgreSQL Server** (if not already added)
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: `18220`
3. **Connect to the server**
4. **Expand Databases** - you'll see `glowsense_db` already exists!
5. **Right-click on `glowsense_db`** → **Restore...**
6. **Select your backup file** and restore

**That's it!** The database is ready for you to restore your backup.

---

## Verification

To verify the database exists:

```powershell
# List all databases
docker exec glowsense-postgres psql -U postgres -l

# Or connect to it
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt"
```

You should see the database and be able to connect to it.

---

**TL;DR: The database is created automatically. Just connect and restore your backup!** ✅

