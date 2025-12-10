# AI Assistant Internal Server Error - Troubleshooting

## Common Causes & Solutions

### Issue 1: Backend Server Not Running

**Symptom:** Internal server error when clicking AI Assistant

**Solution:**
1. **Start the backend server:**
   ```powershell
   cd C:\FYP\backend
   uvicorn main:app --reload
   ```
2. **Verify it's running:**
   ```powershell
   curl http://localhost:8000/rag/health
   ```
   Should return: `{"status":"healthy",...}`

3. **Keep the terminal open** - server needs to keep running

---

### Issue 2: Ollama Not Running

**Symptom:** Backend starts but RAG endpoints fail

**Solution:**
1. **Check if Ollama is running:**
   ```powershell
   curl http://localhost:11434/api/tags
   ```
2. **If not running, start it:**
   ```powershell
   ollama serve
   ```
   (Or it might be running as a Windows service)

3. **Verify models are pulled:**
   ```powershell
   ollama list
   ```
   Should show `nomic-embed-text` and `llama3.1`

---

### Issue 3: Database Connection Error

**Symptom:** Backend can't connect to database

**Solution:**
1. **Check Docker container is running:**
   ```powershell
   docker ps
   ```
   Should show `glowsense-postgres` as running

2. **If not running, start it:**
   ```powershell
   docker start glowsense-postgres
   ```

3. **Check database connection in `.env`:**
   ```
   DATABASE_URL=postgresql://postgres:18220@localhost:5432/glowsense_db
   ```

---

### Issue 4: CORS Error

**Symptom:** Browser console shows CORS error

**Solution:**
Check `backend/main.py` has CORS middleware configured:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue 5: Authentication Token Missing

**Symptom:** 401 Unauthorized error

**Solution:**
1. **Make sure you're logged in** in the frontend
2. **Check token exists:**
   - Open browser DevTools (F12)
   - Go to Application/Storage → Local Storage
   - Check for `token` key

3. **If missing, log in again**

---

### Issue 6: Missing User ID

**Symptom:** Error fetching user profile

**Solution:**
The AI Assistant page tries to fetch user ID. Check:
1. **Backend profile endpoint is working:**
   ```powershell
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/customer/profile
   ```
2. **User is logged in with valid token**

---

## Step-by-Step Debugging

### Step 1: Check Backend is Running

```powershell
# Test health endpoint
curl http://localhost:8000/rag/health
```

**If this fails:** Backend is not running → Start it (see Issue 1)

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Click on AI Assistant
4. Look for error messages

**Common errors:**
- `Failed to fetch` → Backend not running
- `401 Unauthorized` → Token missing/invalid
- `500 Internal Server Error` → Backend error (check backend logs)

### Step 3: Check Backend Logs

Look at the terminal where you ran `uvicorn main:app --reload`

**Look for:**
- Error messages
- Stack traces
- Database connection errors
- Ollama connection errors

### Step 4: Test Endpoint Directly

```powershell
# Test chat endpoint (replace YOUR_TOKEN with actual token)
curl -X POST "http://localhost:8000/rag/chat" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"user_id": 1, "message": "test"}'
```

**If this works:** Issue is in frontend  
**If this fails:** Issue is in backend

---

## Quick Fix Checklist

- [ ] Backend server is running (`uvicorn main:app --reload`)
- [ ] Docker PostgreSQL is running (`docker ps`)
- [ ] Ollama is running (`curl http://localhost:11434/api/tags`)
- [ ] Models are pulled (`ollama list`)
- [ ] User is logged in (token exists in localStorage)
- [ ] CORS is configured in backend
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## Complete Startup Sequence

```powershell
# Terminal 1: Docker PostgreSQL (should already be running)
docker ps

# Terminal 2: Ollama (should already be running)
curl http://localhost:11434/api/tags

# Terminal 3: Backend Server
cd C:\FYP\backend
uvicorn main:app --reload
```

**Then test:**
```powershell
curl http://localhost:8000/rag/health
```

---

## Common Error Messages

### "Failed to fetch"
- **Cause:** Backend not running or CORS issue
- **Fix:** Start backend, check CORS config

### "401 Unauthorized"
- **Cause:** Missing or invalid token
- **Fix:** Log in again

### "500 Internal Server Error"
- **Cause:** Backend error (check logs)
- **Fix:** Check backend terminal for error details

### "Connection refused"
- **Cause:** Backend not running
- **Fix:** Start backend server

---

## Still Not Working?

1. **Check all services are running:**
   ```powershell
   # Docker
   docker ps
   
   # Ollama
   curl http://localhost:11434/api/tags
   
   # Backend
   curl http://localhost:8000/rag/health
   ```

2. **Check backend logs** for specific error messages

3. **Check browser console** for frontend errors

4. **Verify network tab** in DevTools shows the request/response

---

**Most common issue: Backend server is not running!** Start it first. 🚀


