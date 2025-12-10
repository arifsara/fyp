"""
API routes for RAG recommendation system
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
from services.rag_service import RAGService
from services.chat_service import ChatService
# Option to use complete RAG service:
# from rag_service_complete import CompleteRAGService as RAGService

router = APIRouter(prefix="/rag", tags=["RAG"])


# Pydantic models for request/response
class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int


class AddProviderRequest(BaseModel):
    provider_id: int
    provider_data: Dict[str, Any]


class RecommendRequest(BaseModel):
    query: str


class RecommendResponse(BaseModel):
    ai_response: str
    providers: List[Dict[str, Any]]
    query: str


class ChatRequest(BaseModel):
    user_id: int
    session_id: Optional[int] = None
    message: str


class ChatResponse(BaseModel):
    response: str
    providers: List[Dict[str, Any]]
    session_id: int
    session_state: Optional[Dict[str, Any]] = None


@router.post("/embed", response_model=EmbedResponse)
async def embed_text(
    request: EmbedRequest,
    db: Session = Depends(get_db)
):
    """
    Generate embedding vector for text using Ollama nomic-embed-text
    
    Input: JSON { "text": "some user input" }
    Output: JSON embedding vector (list of floats)
    """
    try:
        rag_service = RAGService(db)
        embedding = await rag_service.embed_text(request.text)
        
        return EmbedResponse(
            embedding=embedding,
            dimensions=len(embedding)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@router.post("/add-provider")
async def add_provider(
    request: AddProviderRequest,
    db: Session = Depends(get_db)
):
    """
    Add or update provider embedding
    
    Input: provider info JSON (name, description, skills, etc.)
    Action: Generate embedding from concatenated provider data, save provider with embedding vector in DB.
    """
    try:
        rag_service = RAGService(db)
        success = await rag_service.add_provider_embedding(
            request.provider_id,
            request.provider_data
        )
        
        if success:
            return {"message": "Provider embedding added successfully", "provider_id": request.provider_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to add provider embedding")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add provider embedding: {str(e)}")


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_providers(
    request: RecommendRequest,
    db: Session = Depends(get_db)
):
    """
    Get provider recommendations using RAG
    
    Steps:
    1. Embed user query (call /embed internally)
    2. Search providers table using pgvector similarity, order by distance, limit 5
    3. Format RAG prompt with user query + top providers JSON
    4. Call Ollama Llama 3.1 model with prompt
    5. Return AI response + provider info cards in JSON
    """
    try:
        rag_service = RAGService(db)
        result = await rag_service.recommend_providers(request.query)
        
        return RecommendResponse(
            ai_response=result["ai_response"],
            providers=result["providers"],
            query=result["query"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat endpoint with session management
    
    Input: JSON { "user_id": int, "session_id": int (optional), "message": str }
    Functionality:
    - Store user message
    - Maintain session state (chat context)
    - For recommendation queries, use RAG method
    - Return AI chatbot response, updated session state
    """
    try:
        chat_service = ChatService(db)
        result = await chat_service.process_message(
            request.user_id,
            request.message,
            request.session_id
        )
        
        return ChatResponse(
            response=result["response"],
            providers=result["providers"],
            session_id=result["session_id"],
            session_state=result.get("session_state")
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in /rag/chat endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    from llm.ollama_client import ollama_client
    
    ollama_healthy = await ollama_client.check_health()
    
    return {
        "status": "healthy" if ollama_healthy else "degraded",
        "ollama_available": ollama_healthy,
        "database_connected": True
    }
