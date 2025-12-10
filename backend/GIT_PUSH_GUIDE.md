# Git Push Guide

## ⚠️ Security Warning
**NEVER commit or push personal access tokens to git!** If you've already exposed a token:
1. Revoke it immediately on GitHub
2. Generate a new token
3. Never share tokens in chat or code

## Safe Git Push Steps

### 1. Check Git Status
```bash
cd C:\FYP
git status
```

### 2. Add Files
```bash
git add .
```

### 3. Commit Changes
```bash
git commit -m "Add standby support system and restore models.py"
```

### 4. Configure Remote (if not already done)
```bash
git remote -v
# If no remote, add it:
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 5. Push to GitHub (Using Token)
When prompted for password, use your **Personal Access Token** (not your GitHub password):

```bash
git push origin main
# Or if your branch is called master:
# git push origin master
```

**Username**: Your GitHub username  
**Password**: Your Personal Access Token (ghp_...)

### Alternative: Use Token in URL (One-time)
```bash
git push https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git main
```

### Better: Use Git Credential Manager
```bash
# Store credentials securely
git config --global credential.helper wincred
git push origin main
# Enter token when prompted
```

## Recommended: Use SSH Instead
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Add to GitHub: Settings → SSH and GPG keys
3. Use SSH URL: `git remote set-url origin git@github.com:USERNAME/REPO.git`
4. Push: `git push origin main` (no token needed!)

