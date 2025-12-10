# RAG Module - What's Next?

## ✅ What You've Completed

- [x] Docker PostgreSQL with pgvector
- [x] RAG tables created
- [x] Ollama installed and running
- [x] Models pulled (nomic-embed-text, llama3.1)
- [x] Backend running
- [x] RAG module tested

---

## 🎯 Next Steps

### Step 1: Generate Embeddings for Existing Providers

**Important:** For the RAG module to recommend your service providers, you need to generate embeddings for them.

#### Option A: Use the API Endpoint (Manual)

For each provider, call:

```powershell
curl -X POST "http://localhost:8000/rag/add-provider" `
  -H "Content-Type: application/json" `
  -d '{
    "provider_id": 1,
    "name": "John Doe",
    "description": "Experienced makeup artist specializing in bridal makeup",
    "skills": "Bridal makeup, Special effects, Airbrush makeup"
  }'
```

#### Option B: Create a Script (Recommended)

Create `generate_all_provider_embeddings.py`:

```python
"""
Script to generate embeddings for all existing service providers
Run this once to populate embeddings for all providers
"""
import requests
import os
import sys
from sqlalchemy.orm import Session

# Add backend to path
sys.path.append(os.path.dirname(__file__))

from database import SessionLocal
from models import ServiceProvider

def generate_embeddings():
    db: Session = SessionLocal()
    
    try:
        providers = db.query(ServiceProvider).all()
        print(f"Found {len(providers)} providers to process...\n")
        
        base_url = "http://localhost:8000"
        
        for provider in providers:
            try:
                # Prepare provider data
                name = provider.full_name or ""
                description = provider.bio or ""
                skills = provider.certificates or ""
                
                # Call the API
                response = requests.post(
                    f"{base_url}/rag/add-provider",
                    json={
                        "provider_id": provider.id,
                        "name": name,
                        "description": description,
                        "skills": skills
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    print(f"✅ Provider {provider.id} ({name}): Embedding generated")
                else:
                    print(f"❌ Provider {provider.id} ({name}): Error {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Provider {provider.id}: Exception - {str(e)}")
        
        print(f"\n✅ Completed processing {len(providers)} providers")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting provider embedding generation...")
    print("Make sure your backend is running on http://localhost:8000\n")
    generate_embeddings()
```

**Run it:**

```powershell
cd C:\FYP\backend
python generate_all_provider_embeddings.py
```

---

### Step 2: Test RAG Recommendations

After generating embeddings, test the recommendation endpoint:

```powershell
# Test recommendation
curl -X POST "http://localhost:8000/rag/recommend" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{"query": "I need a makeup artist for my wedding"}'
```

**Expected:** AI response with recommended providers based on the query.

---

### Step 3: Test Chat Endpoint

```powershell
curl -X POST "http://localhost:8000/rag/chat" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "message": "Can you recommend a hairstylist?",
    "session_id": null
  }'
```

**Expected:** AI response with recommendations and provider list.

---

### Step 4: Integrate into Frontend (Optional)

Create a chat interface in your Next.js frontend:

**Example component:** `glowsense-web/src/components/rag/ChatInterface.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask for provider recommendations..."
      />
      <button onClick={handleSend} disabled={loading}>
        Send
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

---

### Step 5: Auto-Generate Embeddings for New Providers

**Update your provider registration endpoint** to automatically generate embeddings when a new provider signs up.

In `backend/main.py`, after creating a provider:

```python
# After provider creation
try:
    # Generate embedding automatically
    from services.rag_service import RAGService
    rag_service = RAGService(db)
    await rag_service.add_provider_with_embedding(
        provider_id=provider.id,
        name=provider.full_name,
        description=provider.bio or "",
        skills=provider.certificates or ""
    )
except Exception as e:
    print(f"Warning: Could not generate embedding for provider {provider.id}: {e}")
    # Don't fail the registration if embedding fails
```

---

## 📊 Monitoring & Maintenance

### Check Embedding Status

```sql
-- In pgAdmin or psql
SELECT 
    id, 
    full_name, 
    CASE 
        WHEN embedding IS NULL THEN 'No embedding'
        ELSE 'Has embedding'
    END as embedding_status
FROM service_providers;
```

### Regenerate Embeddings

If provider information changes, regenerate:

```powershell
# Update a specific provider
curl -X POST "http://localhost:8000/rag/add-provider" `
  -H "Content-Type: application/json" `
  -d '{
    "provider_id": 1,
    "name": "Updated Name",
    "description": "Updated description",
    "skills": "Updated skills"
  }'
```

---

## 🎨 Frontend Integration Ideas

1. **Chat Widget**: Add a chat interface to the dashboard
2. **Smart Search**: Use RAG for intelligent provider search
3. **Recommendation Badge**: Show "AI Recommended" on provider cards
4. **Query Suggestions**: Suggest common queries to users

---

## 🔧 Optimization Tips

### 1. Batch Embedding Generation

For large numbers of providers, process in batches:

```python
# Process 10 at a time
for i in range(0, len(providers), 10):
    batch = providers[i:i+10]
    # Process batch
```

### 2. Cache Common Queries

Cache frequent recommendation queries to reduce LLM calls.

### 3. Update Embeddings Periodically

Set up a scheduled task to regenerate embeddings when provider data changes.

---

## 📝 Testing Checklist

- [ ] Generate embeddings for all existing providers
- [ ] Test recommendation endpoint with various queries
- [ ] Test chat endpoint with conversation flow
- [ ] Verify providers are returned correctly
- [ ] Test with providers that have no embedding (should handle gracefully)
- [ ] Test error handling (Ollama down, etc.)

---

## 🚀 Production Considerations

### Environment Variables

Make sure your `.env` has:

```env
OLLAMA_HOST=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.1
```

### Error Handling

The RAG module should gracefully handle:
- Ollama being down
- No matching providers
- Slow responses
- Invalid queries

### Performance

- Consider caching embeddings
- Use connection pooling for database
- Monitor Ollama response times
- Consider using a faster LLM for production

---

## 📚 API Endpoints Summary

### Available Endpoints:

1. **GET `/rag/health`** - Health check
2. **POST `/rag/embed`** - Generate embedding for text
3. **POST `/rag/add-provider`** - Generate and save provider embedding
4. **POST `/rag/recommend`** - Get AI recommendations based on query
5. **POST `/rag/chat`** - Chat with AI (with session management)

---

## 🎉 You're Ready!

Your RAG module is set up and working. Now:

1. **Generate embeddings** for your providers
2. **Test the recommendations**
3. **Integrate into your frontend** (optional)
4. **Start using AI-powered recommendations!**

**Next:** Run the embedding generation script to populate your provider embeddings!

