# Installing pgvector on Windows

## Problem
The error `extension "vector" is not available` means pgvector is not installed on your PostgreSQL server.

## Solution Options

### Option 1: Use PostgreSQL with pgvector Pre-installed (Easiest)

**Use a PostgreSQL distribution that includes pgvector:**

1. **Postgres.app alternatives** (if available for Windows)
2. **Docker** (Recommended):
   ```powershell
   docker run -d \
     --name postgres-pgvector \
     -e POSTGRES_PASSWORD=yourpassword \
     -e POSTGRES_DB=glowsense_db \
     -p 5432:5432 \
     pgvector/pgvector:pg16
   ```

3. **Supabase Local** (includes pgvector):
   ```powershell
   npx supabase start
   ```

### Option 2: Compile pgvector from Source (Advanced)

**Prerequisites:**
- Visual Studio 2019 or later with C++ tools
- PostgreSQL development headers
- Git

**Steps:**

1. **Install PostgreSQL Development Headers:**
   - Download PostgreSQL source code or use vcpkg
   - Or use a PostgreSQL installation that includes development files

2. **Clone and Build:**
   ```powershell
   git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
   cd pgvector
   
   # Set PostgreSQL paths (adjust to your installation)
   $env:PG_CONFIG = "C:\Program Files\PostgreSQL\16\bin\pg_config.exe"
   
   # Build (requires Visual Studio Developer Command Prompt)
   nmake /F Makefile.windows
   nmake /F Makefile.windows install
   ```

3. **Enable Extension:**
   ```sql
   CREATE EXTENSION vector;
   ```

### Option 3: Use Pre-built Binaries (If Available)

Check the pgvector releases page for Windows binaries:
- https://github.com/pgvector/pgvector/releases

### Option 4: Use WSL2 (Windows Subsystem for Linux)

If you have WSL2 installed:

```bash
# In WSL2 terminal
sudo apt-get update
sudo apt-get install postgresql-16-pgvector

# Or compile from source in WSL2
sudo apt-get install postgresql-server-dev-16 build-essential git
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

Then connect to PostgreSQL from Windows.

---

## Quick Test After Installation

```sql
-- Connect to your database
psql -U postgres -d glowsense_db

-- Test pgvector
CREATE EXTENSION IF NOT EXISTS vector;
SELECT vector('[1,2,3]');
```

If this works, pgvector is installed correctly!

---

## Recommended: Docker Approach

**Easiest method for Windows:**

1. **Stop your current PostgreSQL** (if running)

2. **Run PostgreSQL with pgvector:**
   ```powershell
   docker run -d `
     --name glowsense-postgres `
     -e POSTGRES_PASSWORD=18220 `
     -e POSTGRES_DB=glowsense_db `
     -p 5432:5432 `
     pgvector/pgvector:pg16
   ```

3. **Update your DATABASE_URL** in `.env`:
   ```
   DATABASE_URL=postgresql://postgres:18220@localhost:5432/glowsense_db
   ```

4. **Run migrations** (recreate your tables):
   ```powershell
   python create_rag_tables.py
   ```

---

## Alternative: Continue Without pgvector

**The RAG module will work without pgvector, but with limitations:**

- ✅ Chat functionality will work
- ✅ LLM responses will work
- ❌ Vector similarity search will be disabled
- ❌ Provider recommendations based on embeddings won't work

You can still use the RAG module for general chat, but provider recommendations will need to use traditional SQL queries instead of vector search.

---

## Need Help?

1. Check your PostgreSQL version: `SELECT version();`
2. Check if extension is available: `SELECT * FROM pg_available_extensions WHERE name = 'vector';`
3. Check installation path: `SHOW sharedir;`

If you're stuck, consider using Docker with the pgvector image - it's the most reliable method on Windows.

