# Where to Run Ollama Commands

## Important: Ollama is System-Wide

**Ollama commands can be run from ANY directory** - it's installed system-wide, not in your project.

---

## Step-by-Step: Running Ollama

### Step 1: Install Ollama First (If Not Already Installed)

1. **Download:** https://ollama.ai/download
2. **Install** Ollama for Windows
3. **Restart** your computer (recommended)

### Step 2: Open a NEW Terminal

**Important:** Use a **separate terminal** from your backend server.

**Option A: New PowerShell Window**
- Press `Win + X`
- Click **"Windows PowerShell"** or **"Terminal"**
- This opens a NEW terminal window

**Option B: New Terminal Tab (if using VS Code)**
- Click the **"+"** button in the terminal panel
- Or press `` Ctrl + ` `` to open a new terminal

### Step 3: Run Ollama Serve (Any Directory)

**You can run this from ANY directory:**

```powershell
# From C:\ (root)
ollama serve

# OR from C:\FYP
ollama serve

# OR from C:\FYP\backend
ollama serve

# All work the same! ✅
```

**The directory doesn't matter** - Ollama is installed system-wide.

### Step 4: Keep This Terminal Open

- **Don't close this terminal** - Ollama needs to keep running
- You'll see output like:
  ```
  Ollama is running on http://localhost:11434
  ```
- **Minimize it** if you want, but don't close it

---

## Complete Setup Process

### Terminal 1: Ollama Server (Keep Running)

```powershell
# Open NEW terminal (any directory)
ollama serve
```

**Keep this running!**

### Terminal 2: Pull Models

```powershell
# Open ANOTHER new terminal (any directory)
ollama pull nomic-embed-text
ollama pull llama3.1
```

### Terminal 3: Your Backend Server

```powershell
# In your project directory
cd C:\FYP\backend
uvicorn main:app --reload
```

---

## Visual Guide

```
┌─────────────────────────────────────┐
│ Terminal 1: Ollama Server          │
│ (Keep running)                      │
│                                     │
│ C:\> ollama serve                   │
│ Ollama is running on...             │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 2: Pull Models            │
│ (Run commands, then can close)      │
│                                     │
│ C:\> ollama pull nomic-embed-text   │
│ C:\> ollama pull llama3.1          │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 3: Backend Server         │
│ (Your main development terminal)     │
│                                     │
│ C:\FYP\backend> uvicorn main:app    │
│                                     │
└─────────────────────────────────────┘
```

---

## Quick Test: Is Ollama Working?

**In a new terminal (any directory):**

```powershell
ollama list
```

**If Ollama is installed and running:**
- You'll see a list of models (or empty list if none pulled yet)
- No errors

**If Ollama is NOT installed:**
- Error: `'ollama' is not recognized`
- Solution: Install from https://ollama.ai/download

**If Ollama is installed but not running:**
- Error: `connection refused` or similar
- Solution: Run `ollama serve` in a separate terminal first

---

## Common Questions

### Q: Can I run it from C:\FYP\backend?
**A:** Yes! Any directory works. Ollama is system-wide.

### Q: Do I need to keep the terminal open?
**A:** Yes, for `ollama serve` - it needs to keep running. For `ollama pull`, you can close after it finishes.

### Q: Can I run it in the background?
**A:** Yes! You can:
- Minimize the terminal
- Or run it as a Windows service (advanced)

### Q: What if I close the terminal?
**A:** Ollama will stop. Just run `ollama serve` again in a new terminal.

---

## Recommended Setup

### Option 1: Separate Terminals (Easiest)

1. **Terminal 1:** `ollama serve` (keep open)
2. **Terminal 2:** `ollama pull` commands (can close after)
3. **Terminal 3:** Your backend server

### Option 2: Background Process (Advanced)

Run Ollama as a background job in PowerShell:

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"
```

This opens a new window that stays open.

---

## Summary

✅ **Where:** Any directory (doesn't matter)  
✅ **How:** Open NEW terminal → Run `ollama serve`  
✅ **Keep it running:** Don't close the terminal  
✅ **Test:** `ollama list` in another terminal  

**That's it!** Ollama is system-wide, so the directory doesn't matter. 🚀

