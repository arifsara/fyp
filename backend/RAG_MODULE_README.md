# RAG-Based Service Provider Recommendation Module

This module implements a Retrieval-Augmented Generation (RAG) system for recommending service providers to customers based on their queries and preferences.

## 📋 Overview

The RAG module uses:
- **pgvector** for vector similarity search in PostgreSQL
- **Ollama** (local LLM) for embeddings (`nomic-embed-text`) and text generation (`llama3.1`)
- **FastAPI** async endpoints for API access
- **SQLAlchemy** ORM with async support

## 🏗️ Architecture

```
backend/
├── rag/
│   ├── __init__.py
│   ├── models.py          # Database models (UserMessage, ChatSession)
│   └── routes.py          # API endpoints
├── services/
│   ├── __init__.py
│   ├── rag_service.py     # RAG logic (embeddings, similarity search)
│   └── chat_service.py    # Chat session management
├── llm/
│   ├── __init__.py
│   └── ollama_client.py   # Ollama API client
└── create_rag_tables.py  # Database migration script
```

## 🚀 Setup

### 1. Install Dependencies

```bash
pip install httpx pgvector
```

Or add to `requirements.txt`:
```
httpx
pgvector
```

### 2. Install pgvector Extension in PostgreSQL

```sql
-- Connect to your database
\c glowsense_db

-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Run Database Migration

```bash
cd backend
python create_rag_tables.py
```

This will:
- Enable pgvector extension
- Create `user_messages` table
- Create `chat_sessions` table
- Add `embedding` column (vector(1536)) to `service_providers` table
- Create indexes for performance

### 4. Install and Start Ollama

```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai

# Start Ollama server
ollama serve

# Pull required models (in separate terminal)
ollama pull nomic-embed-text
ollama pull llama3.1
```

### 5. Configure Environment Variables

Add to `.env` file (optional - defaults provided):

```env
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.1
```

## 📡 API Endpoints

All endpoints are prefixed with `/rag`:

### 1. `POST /rag/embed`

Generate embedding vector for text.

**Request:**
```json
{
  "text": "I need a makeup artist for my wedding"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...],
  "dimensions": 1536
}
```

### 2. `POST /rag/add-provider`

Generate and store embedding for a service provider.

**Request:**
```json
{
  "provider_id": 1,
  "provider_data": {
    "business_name": "Beauty Studio",
    "full_name": "Jane Doe",
    "bio": "Expert makeup artist with 10 years experience",
    "city": "New York",
    "services": [
      {"name": "Bridal Makeup"},
      {"name": "Hair Styling"}
    ],
    "skills": ["makeup", "hair", "bridal"]
  }
}
```

**Response:**
```json
{
  "message": "Provider embedding added successfully",
  "provider_id": 1
}
```

### 3. `POST /rag/recommend`

Get provider recommendations using RAG.

**Request:**
```json
{
  "query": "I'm looking for a makeup artist for my wedding in New York"
}
```

**Response:**
```json
{
  "ai_response": "Based on your query, I recommend...",
  "providers": [
    {
      "id": 1,
      "business_name": "Beauty Studio",
      "full_name": "Jane Doe",
      "bio": "...",
      "city": "New York",
      "similarity": 0.85
    }
  ],
  "query": "I'm looking for a makeup artist..."
}
```

### 4. `POST /rag/chat`

Chat endpoint with session management.

**Request:**
```json
{
  "user_id": 1,
  "session_id": 123,  // Optional
  "message": "Can you recommend a good hair stylist?"
}
```

**Response:**
```json
{
  "response": "I'd be happy to help! Here are some recommendations...",
  "providers": [...],
  "session_id": 123,
  "session_state": {
    "messages": [...],
    "context": {...}
  }
}
```

### 5. `GET /rag/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "ollama_available": true,
  "database_connected": true
}
```

## 🔄 Workflow

### Adding Provider Embeddings

1. When a provider is created/updated, call `/rag/add-provider`
2. The system concatenates provider data (name, bio, services, skills)
3. Generates embedding using Ollama `nomic-embed-text`
4. Stores embedding vector in `service_providers.embedding` column

### Getting Recommendations

1. User sends query via `/rag/recommend` or `/rag/chat`
2. System embeds the user query
3. Searches for similar providers using pgvector cosine similarity
4. Retrieves top 5 matching providers
5. Constructs RAG prompt with query + provider data
6. Generates AI response using Llama 3.1
7. Returns AI response + provider recommendations

## 🧪 Testing

### Test Embedding Generation

```bash
curl -X POST "http://localhost:8000/rag/embed" \
  -H "Content-Type: application/json" \
  -d '{"text": "makeup artist"}'
```

### Test Recommendations

```bash
curl -X POST "http://localhost:8000/rag/recommend" \
  -H "Content-Type: application/json" \
  -d '{"query": "I need a wedding makeup artist"}'
```

### Test Chat

```bash
curl -X POST "http://localhost:8000/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Can you recommend a hair stylist?"
  }'
```

## 📊 Database Schema

### `user_messages`
- `id` (PK)
- `user_id` (FK → customers.id)
- `message` (TEXT)
- `timestamp` (TIMESTAMP)
- `session_id` (FK → chat_sessions.id)

### `chat_sessions`
- `id` (PK)
- `user_id` (FK → customers.id)
- `session_state` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `service_providers` (updated)
- `embedding` (vector(1536)) - NEW COLUMN

## 🔧 Troubleshooting

### pgvector Extension Not Found

```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

If extension doesn't exist, install it:
```bash
# On Ubuntu/Debian
sudo apt-get install postgresql-14-pgvector

# Or compile from source
# https://github.com/pgvector/pgvector
```

### Ollama Connection Error

1. Check if Ollama is running: `ollama list`
2. Verify models are installed: `ollama list`
3. Test connection: `curl http://localhost:11434/api/tags`

### Embedding Dimension Mismatch

- `nomic-embed-text` produces 1536-dimensional vectors
- Ensure `vector(1536)` is used in database schema
- Check embedding length matches: `len(embedding) == 1536`

## 📝 Notes

- The RAG module is **separate** from the main booking/payment system
- Embeddings are generated on-demand when providers are added/updated
- Similarity search uses cosine distance (lower = more similar)
- Vector index (IVFFlat) improves search performance for large datasets
- Chat sessions maintain conversation context for better recommendations

## 🎯 Next Steps

1. **Batch Embedding Generation**: Create script to generate embeddings for all existing providers
2. **Fine-tuning**: Adjust RAG prompt template based on user feedback
3. **Caching**: Cache embeddings for frequently searched queries
4. **Analytics**: Track recommendation accuracy and user satisfaction

---

**Module Status**: ✅ Ready for Integration

