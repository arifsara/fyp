# pgAdmin Backup - File Format Guide

## When Backing Up in pgAdmin

### Step-by-Step Backup Process

1. **Open pgAdmin**
2. **Navigate to your database:**
   - Servers → PostgreSQL → Databases → **glowsense_db**
3. **Right-click on `glowsense_db`** → Select **Backup...**

### Backup Dialog Options

#### Filename Section:
- **Filename**: Click the folder icon (📁) next to the filename field
- **Choose location**: Navigate to `C:\FYP\backend\`
- **File name**: Type `backup_glowsense_db.dump` (or `.backup` if using Custom format)
- **Click Save**

#### Format Section (IMPORTANT):
You'll see a dropdown with format options. Choose one:

### ✅ **Recommended: Custom Format**

**Select: `Custom` or `c`**

**Why Custom format:**
- ✅ Best for restoring to different PostgreSQL versions
- ✅ Can restore specific tables if needed
- ✅ Compressed (smaller file size)
- ✅ Works perfectly with Docker PostgreSQL

**File extension:** `.dump` or `.backup`

**Example filename:** `backup_glowsense_db.dump`

---

### Alternative: Plain Format

**Select: `Plain` or `SQL`**

**When to use:**
- If you want a readable SQL file
- If you need to edit the backup manually
- If Custom format gives you issues

**File extension:** `.sql`

**Example filename:** `backup_glowsense_db.sql`

**Note:** Plain format creates larger files but is more compatible.

---

## Complete Backup Steps

### Using Custom Format (Recommended):

1. **Right-click** `glowsense_db` → **Backup...**
2. **General tab:**
   - **Filename**: Click folder icon → Navigate to `C:\FYP\backend\`
   - **File name**: `backup_glowsense_db.dump`
   - **Format**: Select **`Custom`** from dropdown
3. **Click Backup** button
4. **Wait for completion** (watch the Messages tab)
5. **Click Close** when done

**File created:** `C:\FYP\backend\backup_glowsense_db.dump`

---

### Using Plain Format (Alternative):

1. **Right-click** `glowsense_db` → **Backup...**
2. **General tab:**
   - **Filename**: Click folder icon → Navigate to `C:\FYP\backend\`
   - **File name**: `backup_glowsense_db.sql`
   - **Format**: Select **`Plain`** from dropdown
3. **Click Backup** button
4. **Wait for completion**
5. **Click Close** when done

**File created:** `C:\FYP\backend\backup_glowsense_db.sql`

---

## Visual Guide

### pgAdmin Backup Dialog:

```
┌─────────────────────────────────────┐
│ Backup Database: glowsense_db       │
├─────────────────────────────────────┤
│ General Tab:                         │
│                                     │
│ Filename: [📁] C:\FYP\backend\      │
│          backup_glowsense_db.dump   │
│                                     │
│ Format: [Custom ▼]  ← SELECT THIS  │
│          • Custom                   │
│          • Plain                    │
│          • Tar                      │
│                                     │
│ Encoding: UTF8                      │
│                                     │
│ [Backup]  [Cancel]                  │
└─────────────────────────────────────┘
```

---

## What to Choose

### ✅ **Best Choice: Custom Format**

**Select:** `Custom` from the Format dropdown

**Filename:** `backup_glowsense_db.dump`

**Location:** `C:\FYP\backend\`

**Why:**
- Most reliable for restoring
- Works perfectly with Docker PostgreSQL
- Smaller file size
- Standard format for PostgreSQL backups

---

## After Backup

You should have a file at:
- `C:\FYP\backend\backup_glowsense_db.dump` (if Custom format)
- OR `C:\FYP\backend\backup_glowsense_db.sql` (if Plain format)

**Verify the file exists:**
```powershell
cd C:\FYP\backend
dir backup_glowsense_db.*
```

You should see your backup file listed.

---

## When Restoring Later

### If you used Custom format:
- In pgAdmin Restore dialog, select **Custom** format
- Browse to `backup_glowsense_db.dump`

### If you used Plain format:
- In pgAdmin Restore dialog, select **Plain** format
- Browse to `backup_glowsense_db.sql`

---

## Quick Summary

**What to choose:**
- ✅ **Format**: `Custom` (recommended) or `Plain` (alternative)
- ✅ **Filename**: `backup_glowsense_db.dump` (for Custom) or `backup_glowsense_db.sql` (for Plain)
- ✅ **Location**: `C:\FYP\backend\`

**That's it!** Just select **Custom** format and save as `backup_glowsense_db.dump` in the backend folder.

