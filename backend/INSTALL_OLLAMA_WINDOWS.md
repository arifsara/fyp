# Installing Ollama on Windows

## Error: 'ollama' is not recognized

This means Ollama is **not installed** on your system yet. You need to install it first.

---

## Step-by-Step Installation

### Step 1: Download Ollama

1. **Visit:** https://ollama.ai/download
2. **Click:** "Download for Windows"
3. **Save** the installer file (e.g., `OllamaSetup.exe`)

### Step 2: Install Ollama

1. **Run** the installer file you downloaded
2. **Follow** the installation wizard:
   - Click "Next" or "Install"
   - Accept the license agreement
   - Choose installation location (default is fine)
   - Click "Install"
3. **Wait** for installation to complete
4. **Click** "Finish"

### Step 3: Restart Your Terminal

**Important:** After installation, you need to:
- **Close** your current PowerShell/terminal
- **Open a NEW terminal** (this refreshes the PATH)
- Or restart your computer (recommended)

### Step 4: Verify Installation

**In a NEW terminal, run:**

```powershell
ollama --version
```

**If it works**, you'll see the version number (e.g., `ollama version is 0.1.x`)

**If it still doesn't work:**
- Restart your computer
- Or manually add Ollama to PATH (see troubleshooting below)

---

## After Installation: Start Ollama

### Step 1: Start Ollama Server

**Open a NEW terminal** (any directory):

```powershell
ollama serve
```

You should see:
```
Ollama is running on http://localhost:11434
```

**Keep this terminal open!**

### Step 2: Pull Models (In Another Terminal)

**Open ANOTHER new terminal:**

```powershell
# Pull embedding model
ollama pull nomic-embed-text

# Pull LLM model
ollama pull llama3.1
```

This will download the models (may take a few minutes).

### Step 3: Verify Models

```powershell
ollama list
```

Should show:
```
NAME                ID              SIZE    MODIFIED
nomic-embed-text    ...             ...     ...
llama3.1            ...             ...     ...
```

---

## Troubleshooting

### Issue: Still "not recognized" after installation

**Solution 1: Restart Computer**
- Restart your computer
- This ensures PATH is updated

**Solution 2: Check Installation Path**

Ollama is usually installed at:
- `C:\Users\YourUsername\AppData\Local\Programs\Ollama\`

**Verify it exists:**
```powershell
Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
```

**If it exists but command doesn't work:**
- Restart terminal
- Or restart computer

**Solution 3: Manually Add to PATH**

1. Press `Win + R`
2. Type: `sysdm.cpl` → Enter
3. Click **"Advanced"** tab
4. Click **"Environment Variables"**
5. Under **"User variables"**, find **"Path"**
6. Click **"Edit"**
7. Click **"New"**
8. Add: `C:\Users\YourUsername\AppData\Local\Programs\Ollama`
9. Click **"OK"** on all dialogs
10. **Restart terminal**

### Issue: Installation fails

**Check:**
- You have administrator rights
- Antivirus isn't blocking it
- Enough disk space (models need ~4-8GB)

### Issue: Can't download

**Try:**
- Different browser
- Check internet connection
- Download from: https://github.com/ollama/ollama/releases

---

## Quick Installation Checklist

- [ ] Downloaded Ollama from https://ollama.ai/download
- [ ] Ran the installer
- [ ] Restarted terminal (or computer)
- [ ] Verified: `ollama --version` works
- [ ] Started: `ollama serve`
- [ ] Pulled models: `ollama pull nomic-embed-text` and `ollama pull llama3.1`
- [ ] Verified: `ollama list` shows models

---

## Alternative: Check if Already Installed

**Maybe Ollama is installed but not in PATH?**

**Check common locations:**

```powershell
# Check if Ollama exists
Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
Test-Path "$env:ProgramFiles\Ollama\ollama.exe"
Test-Path "C:\Program Files\Ollama\ollama.exe"
```

**If found, run directly:**

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" serve
```

---

## After Successful Installation

Once `ollama serve` is running, you can:

1. **Test it:**
   ```powershell
   # In another terminal
   curl http://localhost:11434/api/tags
   ```

2. **Start your backend:**
   ```powershell
   cd C:\FYP\backend
   uvicorn main:app --reload
   ```

3. **Test RAG endpoint:**
   ```powershell
   curl http://localhost:8000/rag/health
   ```

---

**TL;DR: Download from https://ollama.ai/download, install it, restart terminal, then run `ollama serve`** ✅

