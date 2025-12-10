"""
Complete RAG API Routes
All endpoints for embedding, search, and recommendations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db
from rag_service_complete import CompleteRAGService

router = APIRouter(prefix="/rag", tags=["RAG"])


# =====================================================
# Pydantic Models
# =====================================================

class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int


class BeauticianData(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    full_name: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    specialties: Optional[str] = None
    rating: Optional[float] = None
    experience: Optional[int] = None
    description: Optional[str] = None
    bio: Optional[str] = None


class AddBeauticianRequest(BaseModel):
    beautician_id: int
    beautician_data: BeauticianData


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5


class SearchResponse(BaseModel):
    beauticians: List[Dict[str, Any]]
    query: str
    count: int


class RecommendRequest(BaseModel):
    query: str


class RecommendResponse(BaseModel):
    ai_response: str
    beauticians: List[Dict[str, Any]]
    query: str


# =====================================================
# API Endpoints
# =====================================================

@router.post("/embed", response_model=EmbedResponse)
async def embed_text(
    request: EmbedRequest,
    db: Session = Depends(get_db)
):
    """
    Generate embedding vector for text using Ollama nomic-embed-text
    
    Input: { "text": "some user input" }
    Output: { "embedding": [...], "dimensions": 1536 }
    """
    try:
        rag_service = CompleteRAGService(db)
        embedding = await rag_service.embed_text(request.text)
        
        return EmbedResponse(
            embedding=embedding,
            dimensions=len(embedding)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate embedding: {str(e)}"
        )


@router.post("/embed-beauticians")
async def embed_beauticians(
    request: AddBeauticianRequest,
    db: Session = Depends(get_db)
):
    """
    Generate and store embedding for a beautician/service provider
    
    Input: {
        "beautician_id": 1,
        "beautician_data": {
            "name": "...",
            "city": "...",
            "specialties": "...",
            ...
        }
    }
    Output: { "message": "Embedding added successfully", "beautician_id": 1 }
    """
    try:
        rag_service = CompleteRAGService(db)
        
        # Convert Pydantic model to dict
        beautician_dict = request.beautician_data.dict(exclude_none=True)
        
        success = await rag_service.add_beautician_embedding(
            request.beautician_id,
            beautician_dict
        )
        
        if success:
            return {
                "message": "Beautician embedding added successfully",
                "beautician_id": request.beautician_id
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail="Failed to add beautician embedding"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to add beautician embedding: {str(e)}"
        )


@router.post("/search", response_model=SearchResponse)
async def search_beauticians(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Vector similarity search for beauticians
    
    Steps:
    1. Embed user query using nomic-embed-text
    2. Run pgvector similarity search in PostgreSQL
    3. Return top matching beauticians
    
    Input: { "query": "makeup artist in New York", "limit": 5 }
    Output: { "beauticians": [...], "query": "...", "count": 5 }
    """
    try:
        rag_service = CompleteRAGService(db)
        
        # Step 1: Embed query
        query_embedding = await rag_service.embed_text(request.query)
        
        # Step 2: Vector search in PostgreSQL
        beauticians = await rag_service.search_similar_beauticians(
            query_embedding,
            limit=request.limit or 5
        )
        
        return SearchResponse(
            beauticians=beauticians,
            query=request.query,
            count=len(beauticians)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search beauticians: {str(e)}"
        )


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_beauticians(
    request: RecommendRequest,
    db: Session = Depends(get_db)
):
    """
    Complete RAG endpoint: Embed → Search → Generate
    
    Steps:
    1. Embed user query
    2. Perform pgvector similarity search
    3. Format context
    4. Call LLaMA 3.1 to generate response
    5. Return final answer with recommendations
    
    Input: { "query": "I need a makeup artist for my wedding" }
    Output: {
        "ai_response": "Based on your query, I recommend...",
        "beauticians": [...],
        "query": "..."
    }
    """
    try:
        rag_service = CompleteRAGService(db)
        
        # Run complete RAG pipeline
        result = await rag_service.recommend_beauticians(request.query)
        
        return RecommendResponse(
            ai_response=result["ai_response"],
            beauticians=result["beauticians"],
            query=result["query"]
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in /rag/recommend: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    from llm.ollama_client import ollama_client
    
    try:
        ollama_healthy = await ollama_client.check_health()
        
        # Check database connection
        db_healthy = False
        try:
            db.execute(text("SELECT 1"))
            db_healthy = True
        except:
            pass
        
        # Check pgvector extension
        pgvector_available = False
        try:
            result = db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
            pgvector_available = result.fetchone() is not None
        except:
            pass
        
        return {
            "status": "healthy" if (ollama_healthy and db_healthy) else "degraded",
            "ollama_available": ollama_healthy,
            "database_connected": db_healthy,
            "pgvector_available": pgvector_available
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

