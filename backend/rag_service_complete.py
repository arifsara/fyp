"""
Complete RAG Service Implementation
Handles embeddings, vector search, and RAG generation
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm.ollama_client import ollama_client


class CompleteRAGService:
    """Complete RAG service with all required functionality"""
    
    RAG_PROMPT_TEMPLATE = """You are a beauty service recommendation assistant.

User query: {query}

Retrieved beautician profiles:
{context}

Based on the above profiles, recommend the best beautician(s) based on:
- Location match (city, area)
- Rating and experience
- Specialties matching the user's needs
- Overall fit for the query

Provide a clear, helpful recommendation with reasoning."""

    def __init__(self, db: Session):
        self.db = db
    
    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for text using Ollama nomic-embed-text model
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector (1536 dimensions)
        """
        try:
            embedding = await ollama_client.get_embedding(text)
            if not embedding or len(embedding) == 0:
                raise Exception("Empty embedding returned from Ollama")
            if len(embedding) != 1536:
                print(f"Warning: Expected 1536 dimensions, got {len(embedding)}")
            return embedding
        except Exception as e:
            raise Exception(f"Failed to generate embedding: {str(e)}")
    
    async def add_beautician_embedding(
        self, 
        beautician_id: int, 
        beautician_data: Dict[str, Any]
    ) -> bool:
        """
        Generate and store embedding for a beautician/service provider
        
        Args:
            beautician_id: ID of the beautician/provider
            beautician_data: Dictionary containing beautician information
            
        Returns:
            True if successful
        """
        try:
            # Combine all text fields into a single string for embedding
            text_parts = []
            
            if beautician_data.get("name"):
                text_parts.append(f"Name: {beautician_data['name']}")
            if beautician_data.get("business_name"):
                text_parts.append(f"Business: {beautician_data['business_name']}")
            if beautician_data.get("full_name"):
                text_parts.append(f"Name: {beautician_data['full_name']}")
            if beautician_data.get("city"):
                text_parts.append(f"City: {beautician_data['city']}")
            if beautician_data.get("area"):
                text_parts.append(f"Area: {beautician_data['area']}")
            if beautician_data.get("specialties"):
                text_parts.append(f"Specialties: {beautician_data['specialties']}")
            if beautician_data.get("description"):
                text_parts.append(f"Description: {beautician_data['description']}")
            if beautician_data.get("bio"):
                text_parts.append(f"Bio: {beautician_data['bio']}")
            if beautician_data.get("rating"):
                text_parts.append(f"Rating: {beautician_data['rating']}")
            if beautician_data.get("experience"):
                text_parts.append(f"Experience: {beautician_data['experience']} years")
            
            combined_text = " ".join(text_parts)
            
            if not combined_text.strip():
                raise Exception("No text data provided for embedding")
            
            # Generate embedding
            print(f"Generating embedding for beautician {beautician_id}...")
            embedding = await self.embed_text(combined_text)
            
            # Convert to PostgreSQL array format
            embedding_str = "[" + ",".join(map(str, embedding)) + "]"
            
            # Store in database using raw SQL (more reliable for pgvector)
            query = text("""
                UPDATE service_providers 
                SET embedding = :embedding::vector
                WHERE id = :beautician_id
            """)
            
            result = self.db.execute(query, {
                "embedding": embedding_str,
                "beautician_id": beautician_id
            })
            self.db.commit()
            
            if result.rowcount == 0:
                raise Exception(f"Beautician with id {beautician_id} not found")
            
            print(f"✅ Embedding stored for beautician {beautician_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to store embedding: {str(e)}")
    
    async def search_similar_beauticians(
        self, 
        query_embedding: List[float], 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar beauticians using pgvector cosine similarity
        
        Args:
            query_embedding: Embedding vector of the user query
            limit: Maximum number of results to return
            
        Returns:
            List of beautician dictionaries with similarity scores
        """
        try:
            # Convert embedding to PostgreSQL array format
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # PostgreSQL vector similarity search using cosine distance
            # <=> operator returns cosine distance (lower = more similar)
            query = text("""
                SELECT 
                    sp.id,
                    sp.business_name,
                    sp.full_name,
                    sp.bio,
                    sp.city,
                    sp.email,
                    sp.phone,
                    sp.profile_photo,
                    sp.profile_picture,
                    1 - (sp.embedding <=> :query_embedding::vector) as similarity,
                    (sp.embedding <=> :query_embedding::vector) as distance
                FROM service_providers sp
                WHERE sp.embedding IS NOT NULL
                  AND sp.is_active = true
                ORDER BY sp.embedding <=> :query_embedding::vector
                LIMIT :limit
            """)
            
            result = self.db.execute(query, {
                "query_embedding": embedding_str,
                "limit": limit
            })
            
            beauticians = []
            for row in result:
                beauticians.append({
                    "id": row.id,
                    "name": row.full_name or row.business_name,
                    "business_name": row.business_name,
                    "full_name": row.full_name,
                    "bio": row.bio,
                    "city": row.city,
                    "email": row.email,
                    "phone": row.phone,
                    "profile_photo": row.profile_photo or row.profile_picture,
                    "similarity": float(row.similarity) if row.similarity else 0.0,
                    "distance": float(row.distance) if row.distance else 1.0
                })
            
            return beauticians
            
        except Exception as e:
            error_msg = str(e)
            if "embedding" in error_msg.lower() or "vector" in error_msg.lower():
                raise Exception(
                    f"Vector search failed. Make sure pgvector extension is enabled and "
                    f"embedding column exists. Error: {error_msg}"
                )
            raise Exception(f"Failed to search similar beauticians: {error_msg}")
    
    async def generate_response(
        self, 
        context: List[Dict[str, Any]], 
        query: str
    ) -> str:
        """
        Generate AI response using LLaMA 3.1 via Ollama
        
        Args:
            context: List of beautician profiles from vector search
            query: User's query
            
        Returns:
            Generated AI response text
        """
        try:
            # Format context as JSON
            context_json = json.dumps(context, indent=2, default=str)
            
            # Construct RAG prompt
            prompt = self.RAG_PROMPT_TEMPLATE.format(
                query=query,
                context=context_json
            )
            
            # Generate response using LLaMA 3.1
            print("Generating response with LLaMA 3.1...")
            response = await ollama_client.generate(prompt)
            
            if not response or len(response.strip()) == 0:
                return "I apologize, but I couldn't generate a response. Please try again."
            
            return response.strip()
            
        except Exception as e:
            raise Exception(f"Failed to generate response: {str(e)}")
    
    async def recommend_beauticians(self, user_query: str) -> Dict[str, Any]:
        """
        Complete RAG pipeline: Embed → Search → Generate
        
        Args:
            user_query: User's query or preference
            
        Returns:
            Dictionary containing AI response and beautician recommendations
        """
        try:
            print(f"\n🔍 Processing query: '{user_query}'")
            
            # Step 1: Embed user query
            print("Step 1: Generating query embedding...")
            query_embedding = await self.embed_text(user_query)
            print(f"✅ Embedding generated ({len(query_embedding)} dimensions)")
            
            # Step 2: Vector search in PostgreSQL
            print("Step 2: Searching similar beauticians in database...")
            similar_beauticians = await self.search_similar_beauticians(
                query_embedding, 
                limit=5
            )
            print(f"✅ Found {len(similar_beauticians)} similar beauticians")
            
            # Step 3: Check if we have results
            if not similar_beauticians:
                return {
                    "ai_response": f"I couldn't find any beauticians matching '{user_query}'. Please try rephrasing your query or check back later as we add more providers.",
                    "beauticians": [],
                    "query": user_query
                }
            
            # Step 4: Format context
            context = similar_beauticians
            
            # Step 5: Generate AI response using LLaMA 3.1
            print("Step 3: Generating AI response with LLaMA 3.1...")
            ai_response = await self.generate_response(context, user_query)
            print("✅ Response generated")
            
            return {
                "ai_response": ai_response,
                "beauticians": similar_beauticians,
                "query": user_query
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error in RAG pipeline: {error_msg}")
            raise Exception(f"RAG pipeline failed: {error_msg}")

