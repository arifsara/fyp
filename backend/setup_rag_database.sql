-- =====================================================
-- Complete RAG Database Setup Script
-- PostgreSQL + pgvector Extension
-- =====================================================

-- Step 1: Create Database (if not exists)
-- Run this separately: CREATE DATABASE glowsense_db;

-- Step 2: Connect to your database
-- \c glowsense_db;

-- Step 3: Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 4: Create beauticians table with vector embedding
-- Note: Using service_providers table name to match existing schema
-- If you want a separate beauticians table, uncomment the CREATE TABLE below

-- Option A: Add embedding to existing service_providers table
DO $$ 
BEGIN
    -- Add embedding column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_providers' 
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE service_providers 
        ADD COLUMN embedding vector(1536);
        RAISE NOTICE 'Added embedding column to service_providers';
    ELSE
        RAISE NOTICE 'Embedding column already exists in service_providers';
    END IF;
END $$;

-- Option B: Create separate beauticians table (uncomment if needed)
/*
CREATE TABLE IF NOT EXISTS beauticians (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    area TEXT,
    specialties TEXT,
    rating FLOAT DEFAULT 0.0,
    experience INT DEFAULT 0,
    description TEXT,
    vector_embedding vector(1536),  -- nomic-embed-text produces 1536 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Step 5: Create Vector Index for Fast Similarity Search
-- Using IVFFlat index for cosine similarity
CREATE INDEX IF NOT EXISTS beauty_vector_idx 
ON service_providers 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: If you created beauticians table, use this:
-- CREATE INDEX IF NOT EXISTS beauty_vector_idx 
-- ON beauticians 
-- USING ivfflat (vector_embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Step 6: Create chat_sessions table for RAG chat
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 7: Create user_messages table for chat history
CREATE TABLE IF NOT EXISTS user_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE SET NULL
);

-- Step 8: Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_session_id ON user_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Step 9: Verify Setup
SELECT 
    'pgvector extension' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
         THEN '✅ Installed' 
         ELSE '❌ Not Installed' 
    END as status
UNION ALL
SELECT 
    'service_providers.embedding column' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_providers' AND column_name = 'embedding'
    ) 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'beauty_vector_idx index' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'beauty_vector_idx'
    ) 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
    END as status;

-- =====================================================
-- Test Query: Vector Similarity Search Example
-- =====================================================
-- This is just an example - actual queries will be done via Python
/*
-- Example: Find similar providers (replace :query_vector with actual embedding)
SELECT 
    id,
    business_name,
    full_name,
    city,
    bio,
    (embedding <=> :query_vector::vector) AS distance
FROM service_providers
WHERE embedding IS NOT NULL
ORDER BY embedding <=> :query_vector::vector
LIMIT 5;
*/

