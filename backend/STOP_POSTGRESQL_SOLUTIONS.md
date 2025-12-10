# Solutions for Stopping PostgreSQL Service

## Problem: Permission Error

The error "Cannot open postgresql-x64-18 service" means you need **Administrator privileges**.

## Solution Options

### ✅ Solution 1: Run PowerShell as Administrator (Recommended)

1. **Close current PowerShell**
2. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Click **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
   - Or: Right-click Start menu → **"Windows PowerShell (Admin)"**
3. **Run the command:**
   ```powershell
   Stop-Service -Name postgresql-x64-18
   ```
4. **Verify:**
   ```powershell
   Get-Service -Name postgresql-x64-18
   ```

---

### ✅ Solution 2: Use Services GUI (Easiest)

1. **Press `Win + R`**
2. **Type:** `services.msc` and press Enter
3. **Find:** `postgresql-x64-18` in the list
4. **Right-click** on it
5. **Click:** **Stop**

**No admin prompt needed!**

---

### ✅ Solution 3: Use Command Prompt as Administrator

1. **Press `Win + R`**
2. **Type:** `cmd` and press `Ctrl + Shift + Enter` (opens as admin)
3. **Run:**
   ```cmd
   net stop postgresql-x64-18
   ```

---

### ✅ Solution 4: Try Docker Setup Anyway (Alternative)

Sometimes Docker can work even if the old service is running, but it might conflict on port 5432.

**Try this:**
```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

**If you get a port conflict error**, then you MUST stop the service first (use Solution 1 or 2).

---

## Recommended: Use Services GUI (Solution 2)

**This is the easiest method:**

1. Press `Win + R`
2. Type `services.msc` → Enter
3. Find `postgresql-x64-18`
4. Right-click → **Stop**

**Done!** No admin prompts needed.

---

## After Stopping the Service

Once the service is stopped, continue with:

```powershell
cd C:\FYP\backend
.\setup_docker_postgres.ps1
```

---

## Verify Service is Stopped

```powershell
Get-Service -Name postgresql-x64-18
```

Should show:
```
Status   Name               DisplayName
------   ----               -----------
Stopped  postgresql-x64-18  postgresql-x64-18
```

