# How to CREATE the Backup File (Step-by-Step)

## Important: The File Doesn't Exist Yet!

You need to **CREATE** the backup file by running the backup process in pgAdmin. The file will be created when you complete the backup.

---

## Step-by-Step: Creating the Backup File

### Step 1: Open pgAdmin
- Launch pgAdmin from your Start menu
- Connect to your PostgreSQL server (enter password if needed)

### Step 2: Navigate to Your Database
1. In the left sidebar, expand:
   - **Servers** (click the arrow to expand)
   - **PostgreSQL XX** (your server name, click to expand)
   - **Databases** (click to expand)
   - **glowsense_db** (this is your database)

### Step 3: Start the Backup Process
1. **Right-click** on `glowsense_db` (the database name)
2. A menu will appear
3. Click on **Backup...** (it might say "Backup" or "Backup Database")

### Step 4: Configure the Backup
A dialog window will open. Here's what to do:

#### In the "General" tab:

1. **Filename field:**
   - You'll see a text box with a folder icon (📁) next to it
   - **Click the folder icon** (📁)
   - A file browser will open
   - Navigate to: `C:\FYP\backend\`
   - In the "File name" box at the bottom, type: `backup_glowsense_db.dump`
   - Click **Save** or **OK**

2. **Format dropdown:**
   - Click the dropdown menu
   - Select **Custom** (or "c" or "Custom format")

3. **Other settings:**
   - Leave everything else as default
   - Encoding: UTF8 (default is fine)

### Step 5: Run the Backup
1. Click the **Backup** button (usually at the bottom of the dialog)
2. A new tab will open showing backup progress
3. **Wait for it to complete** - you'll see messages like:
   - "Backup started..."
   - "Backing up database..."
   - "Backup completed successfully"

### Step 6: Verify the File Was Created
1. After backup completes, close the backup dialog
2. Open File Explorer
3. Navigate to: `C:\FYP\backend\`
4. You should now see: `backup_glowsense_db.dump`

**✅ The file is now created!**

---

## Visual Guide

### What You'll See in pgAdmin:

```
Left Sidebar:
├── Servers
    └── PostgreSQL 16
        ├── Databases
            └── glowsense_db  ← RIGHT-CLICK HERE
                ├── Schemas
                ├── Tables
                └── ...
```

### After Right-Clicking:

```
Menu appears:
├── Create
├── Refresh
├── Backup...        ← CLICK THIS
├── Restore...
└── ...
```

### Backup Dialog:

```
┌─────────────────────────────────────┐
│ Backup Database: glowsense_db       │
├─────────────────────────────────────┤
│ General Tab:                         │
│                                     │
│ Filename: [📁]                      │ ← CLICK FOLDER ICON
│                                     │
│ Format: [Custom ▼]                  │ ← SELECT "Custom"
│                                     │
│ Encoding: UTF8                      │
│                                     │
│ [Backup]  [Cancel]                  │ ← CLICK "Backup"
└─────────────────────────────────────┘
```

### After Clicking Folder Icon:

```
File Browser opens:
┌─────────────────────────────────────┐
│ Navigate to: C:\FYP\backend\         │
│                                     │
│ File name: [backup_glowsense_db.dump]│ ← TYPE THIS
│                                     │
│ [Save]  [Cancel]                     │ ← CLICK "Save"
└─────────────────────────────────────┘
```

---

## Troubleshooting

### "I don't see Backup option"
- Make sure you right-clicked on the **database** (`glowsense_db`), not on a table or schema
- The database name should be directly under "Databases" folder

### "File browser doesn't open"
- Try clicking the folder icon again
- Or manually type the path: `C:\FYP\backend\backup_glowsense_db.dump`

### "Backup failed"
- Check that PostgreSQL service is running
- Make sure you have write permissions to `C:\FYP\backend\`
- Check the Messages tab in pgAdmin for error details

### "I can't find the file after backup"
- Check the exact path shown in the backup dialog
- Look in `C:\FYP\backend\` folder
- The file might be named `backup_glowsense_db.backup` instead of `.dump`

---

## Quick Checklist

- [ ] Opened pgAdmin
- [ ] Connected to PostgreSQL server
- [ ] Expanded: Servers → PostgreSQL → Databases
- [ ] Right-clicked on `glowsense_db`
- [ ] Clicked "Backup..."
- [ ] Clicked folder icon (📁)
- [ ] Navigated to `C:\FYP\backend\`
- [ ] Typed filename: `backup_glowsense_db.dump`
- [ ] Selected Format: `Custom`
- [ ] Clicked "Backup" button
- [ ] Waited for completion
- [ ] Verified file exists in `C:\FYP\backend\`

---

## After Backup is Complete

Once you see the file `backup_glowsense_db.dump` in `C:\FYP\backend\`, you're ready for the next step:

1. Stop PostgreSQL service
2. Run Docker setup
3. Restore the backup

---

**Remember: The file doesn't exist until you CREATE it by running the backup!** 🎯

