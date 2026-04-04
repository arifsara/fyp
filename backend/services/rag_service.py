"""
RAG (Retrieval-Augmented Generation) service for provider recommendations
Handles embedding generation, vector similarity search, and RAG prompt construction
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


class RAGService:
    """Service for RAG-based provider recommendations"""
    
    RAG_PROMPT_TEMPLATE = """You are GlowSense AI — an expert beauty assistant. Recommend service providers based on the user's query.

User Query: {user_query}

Matching Providers:
{provider_json}

Instructions:
- Recommend the best matching providers from the list above
- Explain WHY each provider matches (skills, location, services)
- Keep response concise (2-3 sentences per provider)
- If no providers match, politely say so
- Do NOT invent or add providers not in the list"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text using Ollama"""
        return await ollama_client.get_embedding(text)
    
    async def add_provider_embedding(self, provider_id: int, provider_data: Dict[str, Any]) -> bool:
        """
        Generate and store embedding for a service provider
        
        Args:
            provider_id: ID of the service provider
            provider_data: Dictionary containing provider information (name, description, skills, etc.)
            
        Returns:
            True if successful
        """
        # Concatenate provider data into a single text string
        text_parts = []
        
        if provider_data.get("business_name"):
            text_parts.append(f"Business: {provider_data['business_name']}")
        if provider_data.get("full_name"):
            text_parts.append(f"Name: {provider_data['full_name']}")
        if provider_data.get("bio"):
            text_parts.append(f"Bio: {provider_data['bio']}")
        if provider_data.get("city"):
            text_parts.append(f"Location: {provider_data['city']}")
        if provider_data.get("services"):
            if isinstance(provider_data["services"], list):
                services_text = ", ".join([s.get("name", "") for s in provider_data["services"] if isinstance(s, dict)])
            else:
                services_text = str(provider_data["services"])
            text_parts.append(f"Services: {services_text}")
        if provider_data.get("skills"):
            if isinstance(provider_data["skills"], list):
                skills_text = ", ".join(provider_data["skills"])
            else:
                skills_text = str(provider_data["skills"])
            text_parts.append(f"Skills: {skills_text}")
        
        combined_text = " ".join(text_parts)
        
        # Generate embedding
        embedding = await self.embed_text(combined_text)
        
        # Store embedding in database
        # First, ensure the embedding column exists (will be added via migration)
        try:
            # Convert list to PostgreSQL array format
            embedding_str = "[" + ",".join(map(str, embedding)) + "]"
            
            # Update provider with embedding
            query = text("""
                UPDATE service_providers 
                SET embedding = :embedding::vector
                WHERE id = :provider_id
            """)
            
            self.db.execute(query, {
                "embedding": embedding_str,
                "provider_id": provider_id
            })
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to store provider embedding: {str(e)}")
    
    async def search_similar_providers(
        self, 
        query_embedding: List[float], 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar providers using pgvector cosine similarity
        
        Args:
            query_embedding: Embedding vector of the user query
            limit: Maximum number of results to return
            
        Returns:
            List of provider dictionaries with similarity scores
        """
        try:
            # Convert embedding to PostgreSQL array format
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # Use cosine distance (1 - cosine similarity)
            # Lower distance = higher similarity
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
                    1 - (sp.embedding::vector <=> :query_embedding::vector) as similarity
                FROM service_providers sp
                WHERE sp.embedding IS NOT NULL
                  AND sp.is_active = true
                ORDER BY sp.embedding::vector <=> :query_embedding::vector
                LIMIT :limit
            """)
            
            result = self.db.execute(query, {
                "query_embedding": embedding_str,
                "limit": limit
            })
            
            providers = []
            for row in result:
                providers.append({
                    "id": row.id,
                    "business_name": row.business_name,
                    "full_name": row.full_name,
                    "bio": row.bio,
                    "city": row.city,
                    "email": row.email,
                    "phone": row.phone,
                    "profile_photo": row.profile_photo,
                    "profile_picture": row.profile_picture,
                    "similarity": float(row.similarity) if row.similarity else 0.0
                })
            
            return providers
        except Exception as e:
            raise Exception(f"Failed to search similar providers: {str(e)}")
    
    async def recommend_providers(self, user_query: str) -> Dict[str, Any]:
        """
        Generate provider recommendations using RAG
        
        Args:
            user_query: User's query or preference
            
        Returns:
            Dictionary containing AI response and provider recommendations
        """
        # Step 1: Embed user query
        query_embedding = await self.embed_text(user_query)
        
        # Step 2: Search for similar providers
        similar_providers = await self.search_similar_providers(query_embedding, limit=5)
        
        # Step 3: Format providers as JSON for RAG prompt
        if not similar_providers:
            # No providers found - return helpful message
            return {
                "ai_response": f"I couldn't find any service providers matching '{user_query}'. Please try rephrasing your query or check back later as we add more providers.",
                "providers": [],
                "query": user_query
            }
        
        provider_json = json.dumps(similar_providers, indent=2, default=str)
        
        # Step 4: Construct RAG prompt
        prompt = self.RAG_PROMPT_TEMPLATE.format(
            user_query=user_query,
            provider_json=provider_json
        )
        
        # Step 5: Generate AI response using Llama 3.1 (Ollama)
        ai_response = await ollama_client.generate(prompt)
        
        return {
            "ai_response": ai_response,
            "providers": similar_providers,
            "query": user_query
        }

