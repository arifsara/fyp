# Restore Troubleshooting Guide

## Issue: Restore Failed + File Extension

### Your Situation:
- Backup file: `backup_glowsense_db.dump.sql`
- Restore process failed

### Problem Analysis:

The file extension `.dump.sql` suggests:
1. **The backup was created in Plain/SQL format** (not Custom format)
2. **OR** the file extension was changed

## Solution Steps

### Step 1: Check the Actual File Format

**Option A: Check file in pgAdmin backup history**
- Look at what format you selected when creating the backup

**Option B: Check file content**
```powershell
# Open the file and check first few lines
Get-Content C:\FYP\backend\backup_glowsense_db.dump.sql -Head 5
```

If you see SQL statements like `CREATE TABLE`, it's **Plain format**.
If you see binary/encoded content, it's **Custom format**.

---

### Step 2: Restore with Correct Format

#### If File is Plain/SQL Format:

**In pgAdmin Restore dialog:**

1. **Right-click** `glowsense_db` → **Restore...**
2. **General tab:**
   - **Filename**: Browse to `C:\FYP\backend\backup_glowsense_db.dump.sql`
   - **Format**: Select **`Plain`** (NOT Custom!)
3. **Click Restore**

#### If File is Custom Format:

1. **Right-click** `glowsense_db` → **Restore...**
2. **General tab:**
   - **Filename**: Browse to your backup file
   - **Format**: Select **`Custom`**
3. **Click Restore**

---

### Step 3: Alternative - Use Command Line Restore

If pgAdmin restore keeps failing, use command line:

#### For Plain/SQL Format (.sql file):

```powershell
Get-Content C:\FYP\backend\backup_glowsense_db.dump.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

#### For Custom Format (.dump file):

```powershell
Get-Content C:\FYP\backend\backup_glowsense_db.dump | docker exec -i glowsense-postgres pg_restore -U postgres -d glowsense_db
```

---

### Step 4: Common Restore Issues & Fixes

#### Issue 1: "Database already has objects"

**Fix:** Drop and recreate the database first:

```powershell
# Connect to Docker PostgreSQL
docker exec -it glowsense-postgres psql -U postgres

# In psql, run:
DROP DATABASE glowsense_db;
CREATE DATABASE glowsense_db;
\q
```

Then restore again.

#### Issue 2: "Permission denied"

**Fix:** Make sure Docker container is running:
```powershell
docker ps
```

#### Issue 3: "File not found"

**Fix:** Check the exact file path:
```powershell
dir C:\FYP\backend\backup_glowsense_db.*
```

#### Issue 4: "Wrong format"

**Fix:** 
- If file is `.sql` → Use **Plain** format
- If file is `.dump` → Use **Custom** format

---

## Recommended: Command Line Restore (Most Reliable)

### For .sql file (Plain format):

```powershell
# Navigate to backend
cd C:\FYP\backend

# Restore using command line
Get-Content backup_glowsense_db.dump.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

**This will:**
- Read the SQL file
- Pipe it to Docker PostgreSQL
- Execute all SQL commands
- Show progress in terminal

### For .dump file (Custom format):

```powershell
cd C:\FYP\backend
Get-Content backup_glowsense_db.dump | docker exec -i glowsense-postgres pg_restore -U postgres -d glowsense_db
```

---

## Step-by-Step: Fix Your Current Situation

### Since your file is `backup_glowsense_db.dump.sql`:

**Option 1: Restore in pgAdmin (Plain format)**

1. Right-click `glowsense_db` → **Restore...**
2. **Filename**: Select `backup_glowsense_db.dump.sql`
3. **Format**: Select **`Plain`** (important!)
4. Click **Restore**

**Option 2: Restore using Command Line (Recommended)**

```powershell
cd C:\FYP\backend
Get-Content backup_glowsense_db.dump.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

---

## Verify Restore Success

After restore, verify your data:

```powershell
# Check tables exist
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "\dt"

# Check some data
docker exec glowsense-postgres psql -U postgres -d glowsense_db -c "SELECT COUNT(*) FROM customers;"
```

You should see your tables and data.

---

## If Restore Still Fails

### Check Docker Container:

```powershell
# Is container running?
docker ps

# Check logs for errors
docker logs glowsense-postgres
```

### Check File:

```powershell
# Verify file exists and size
dir C:\FYP\backend\backup_glowsense_db.dump.sql

# Check file is not corrupted (first few lines should be readable)
Get-Content C:\FYP\backend\backup_glowsense_db.dump.sql -Head 10
```

### Try Fresh Database:

If restore keeps failing, start fresh:

```powershell
# Drop and recreate database
docker exec glowsense-postgres psql -U postgres -c "DROP DATABASE IF EXISTS glowsense_db;"
docker exec glowsense-postgres psql -U postgres -c "CREATE DATABASE glowsense_db;"

# Then restore
Get-Content C:\FYP\backend\backup_glowsense_db.dump.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

---

## Quick Fix Command

**For your `.dump.sql` file, run this:**

```powershell
cd C:\FYP\backend
Get-Content backup_glowsense_db.dump.sql | docker exec -i glowsense-postgres psql -U postgres -d glowsense_db
```

This should restore your data successfully!

