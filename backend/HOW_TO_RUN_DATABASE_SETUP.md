# How to Run Database Setup Commands

## 🎯 Quick Answer

Run the SQL commands in **PostgreSQL** using one of these methods:

## Method 1: Using psql Command Line (Recommended)

### Step 1: Open PowerShell or Command Prompt

```powershell
# Navigate to backend directory (optional, but helpful)
cd C:\FYP\backend
```

### Step 2: Connect to PostgreSQL

```powershell
# Replace with your PostgreSQL username and database name
psql -U postgres -d glowsense_db
```

**If you get "psql is not recognized":**
- Add PostgreSQL bin directory to PATH, OR
- Use full path: `C:\Program Files\PostgreSQL\15\bin\psql.exe -U postgres -d glowsense_db`
- OR use pgAdmin (Method 2 below)

### Step 3: Run the SQL File

Once connected to psql, run:

```sql
\i setup_rag_database.sql
```

**OR** copy and paste the SQL commands directly:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_providers' 
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE service_providers 
        ADD COLUMN embedding vector(1536);
    END IF;
END $$;

-- Create vector index
CREATE INDEX IF NOT EXISTS beauty_vector_idx 
ON service_providers 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Step 4: Verify Setup

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if embedding column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_providers' AND column_name = 'embedding';

-- Exit psql
\q
```

---

## Method 2: Using pgAdmin (GUI - Easier)

### Step 1: Open pgAdmin

1. Launch pgAdmin from Start Menu
2. Connect to your PostgreSQL server
3. Expand: `Servers` → `Your Server` → `Databases` → `glowsense_db`

### Step 2: Open Query Tool

1. Right-click on `glowsense_db`
2. Select **"Query Tool"**

### Step 3: Run SQL Commands

1. Open the file `C:\FYP\backend\setup_rag_database.sql` in a text editor
2. Copy all the SQL commands
3. Paste into pgAdmin Query Tool
4. Click **"Execute"** (or press F5)

### Step 4: Verify

Run this query to verify:

```sql
SELECT 
    'pgvector extension' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
         THEN '✅ Installed' 
         ELSE '❌ Not Installed' 
    END as status;
```

---

## Method 3: Using Python Script (Alternative)

Create a file `run_setup.py`:

```python
import psycopg2
from psycopg2 import sql

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="glowsense_db",
    user="postgres",
    password="your_password"  # Replace with your password
)

cur = conn.cursor()

# Read and execute SQL file
with open('setup_rag_database.sql', 'r') as f:
    sql_commands = f.read()
    cur.execute(sql_commands)

conn.commit()
cur.close()
conn.close()

print("✅ Database setup complete!")
```

Run it:
```powershell
cd C:\FYP\backend
python run_setup.py
```

---

## Method 4: Using Docker (If using Docker PostgreSQL)

If your PostgreSQL is in Docker:

```powershell
# Copy SQL file into container
docker cp setup_rag_database.sql container_name:/tmp/

# Execute SQL in container
docker exec -i container_name psql -U postgres -d glowsense_db < setup_rag_database.sql
```

---

## ✅ Verification Checklist

After running setup, verify:

1. **pgvector extension enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
   Should return 1 row.

2. **Embedding column exists:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'service_providers' AND column_name = 'embedding';
   ```
   Should return 'embedding'.

3. **Vector index created:**
   ```sql
   SELECT indexname FROM pg_indexes WHERE indexname = 'beauty_vector_idx';
   ```
   Should return 'beauty_vector_idx'.

---

## 🐛 Troubleshooting

### "psql: command not found"
- Install PostgreSQL client tools
- OR use pgAdmin (Method 2)
- OR add PostgreSQL bin to PATH

### "password authentication failed"
- Check your PostgreSQL password
- Update connection string in `.env` file

### "extension vector does not exist"
- Install pgvector extension first
- See `PGVECTOR_WINDOWS_INSTALL.md` for instructions

### "permission denied"
- Make sure you're using a user with CREATE privileges
- Try: `psql -U postgres -d glowsense_db` (postgres user has all privileges)

---

## 📍 File Location

The SQL file is located at:
```
C:\FYP\backend\setup_rag_database.sql
```

---

## 🎯 Recommended Method

**For Windows users:** Use **pgAdmin (Method 2)** - it's the easiest and most visual.

**For command-line users:** Use **psql (Method 1)** - it's faster once you know how.

---

**After running setup, proceed to generate embeddings:**
```powershell
cd C:\FYP\backend
python generate_all_embeddings.py
```

