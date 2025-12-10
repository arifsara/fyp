"""
Chat service for managing user conversations and session state
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, Optional
from datetime import datetime
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.models import UserMessage, ChatSession
from services.rag_service import RAGService
from llm.ollama_client import ollama_client


class ChatService:
    """Service for managing chat sessions and conversations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.rag_service = RAGService(db)
    
    def get_or_create_session(self, user_id: int, session_id: Optional[int] = None) -> ChatSession:
        """
        Get existing session or create a new one
        
        Args:
            user_id: ID of the user
            session_id: Optional session ID to retrieve existing session
            
        Returns:
            ChatSession object
        """
        if session_id:
            session = self.db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
            if session:
                return session
        
        # Create new session
        try:
            new_session = ChatSession(
                user_id=user_id,
                session_state={"messages": [], "context": {}}
            )
            self.db.add(new_session)
            self.db.commit()
            self.db.refresh(new_session)
            return new_session
        except Exception as e:
            self.db.rollback()
            # Check if tables exist
            from sqlalchemy import inspect
            try:
                inspector = inspect(self.db.bind)
                tables = inspector.get_table_names()
                if "chat_sessions" not in tables:
                    raise Exception("chat_sessions table does not exist. Please run the RAG setup script to create the tables.")
            except:
                pass
            raise Exception(f"Failed to create chat session: {str(e)}")
    
    def store_message(self, user_id: int, message: str, session_id: int) -> UserMessage:
        """
        Store a user message
        
        Args:
            user_id: ID of the user
            message: Message text
            session_id: Session ID
            
        Returns:
            UserMessage object
        """
        try:
            user_message = UserMessage(
                user_id=user_id,
                message=message,
                session_id=session_id
            )
            self.db.add(user_message)
            self.db.commit()
            self.db.refresh(user_message)
            return user_message
        except Exception as e:
            self.db.rollback()
            from sqlalchemy import inspect
            inspector = inspect(self.db.bind)
            tables = inspector.get_table_names()
            if "user_messages" not in tables:
                raise Exception("user_messages table does not exist. Please run the RAG setup script to create the tables.")
            raise Exception(f"Failed to store message: {str(e)}")
    
    def update_session_state(self, session: ChatSession, state_updates: Dict[str, Any]):
        """
        Update session state with new information
        
        Args:
            session: ChatSession object
            state_updates: Dictionary of state updates
        """
        current_state = session.session_state or {}
        current_state.update(state_updates)
        session.session_state = current_state
        session.updated_at = datetime.utcnow()
        self.db.commit()
    
    async def process_message(
        self, 
        user_id: int, 
        message: str, 
        session_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and generate response
        
        Args:
            user_id: ID of the user
            message: User's message
            session_id: Optional session ID
            
        Returns:
            Dictionary containing AI response, session info, and recommendations
        """
        try:
            # Get or create session
            session = self.get_or_create_session(user_id, session_id)
            
            # Store user message
            user_msg = self.store_message(user_id, message, session.id)
            
            # Get recent messages for context
            recent_messages = self.db.query(UserMessage).filter(
                UserMessage.session_id == session.id
            ).order_by(desc(UserMessage.timestamp)).limit(10).all()
            
            # Always use RAG for provider recommendations
            # This ensures all queries get RAG-based service provider recommendations
            # Check if message is asking about providers/services
            recommendation_keywords = [
                "recommend", "suggest", "find", "looking for", "need", 
                "want", "search", "best", "good", "provider", "service",
                "makeup", "hair", "stylist", "artist", "beauty", "salon",
                "who", "where", "can you", "help me", "show me"
            ]
            
            # Use RAG if it's a recommendation query OR if it's a general query (default to RAG)
            is_recommendation_query = any(
                keyword in message.lower() for keyword in recommendation_keywords
            ) or len(message.split()) >= 3  # Use RAG for queries with 3+ words
            
            if is_recommendation_query:
                # Use RAG for recommendations
                result = await self.rag_service.recommend_providers(message)
                
                # Store AI response in session
                ai_message = UserMessage(
                    user_id=user_id,
                    message=result["ai_response"],
                    session_id=session.id
                )
                self.db.add(ai_message)
                
                # Update session state
                self.update_session_state(session, {
                    "last_query": message,
                    "last_recommendations": result["providers"],
                    "messages": [
                        {"role": "user", "content": msg.message, "timestamp": msg.timestamp.isoformat()}
                        for msg in recent_messages[-5:]
                    ]
                })
                
                return {
                    "response": result["ai_response"],
                    "providers": result["providers"],
                    "session_id": session.id,
                    "session_state": session.session_state
                }
            else:
                # General chat - use simple LLM response
                # For now, use a basic prompt (can be enhanced later)
                prompt = f"""You are GlowSense AI, a helpful beauty assistant. 
                
User message: {message}

Previous conversation context:
{json.dumps([{"role": "user" if i % 2 == 0 else "assistant", "content": msg.message} for i, msg in enumerate(recent_messages[-3:])], default=str)}

Provide a helpful, concise response."""
                
                ai_response = await ollama_client.generate(prompt)
                
                # Store AI response
                ai_message = UserMessage(
                    user_id=user_id,
                    message=ai_response,
                    session_id=session.id
                )
                self.db.add(ai_message)
                
                # Update session state
                self.update_session_state(session, {
                    "messages": [
                        {"role": "user" if i % 2 == 0 else "assistant", "content": msg.message, "timestamp": msg.timestamp.isoformat()}
                        for i, msg in enumerate(recent_messages[-5:])
                    ]
                })
                
                return {
                    "response": ai_response,
                    "providers": [],
                    "session_id": session.id,
                    "session_state": session.session_state
                }
        except Exception as e:
            # Log the error and re-raise with more context
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in process_message: {str(e)}")
            print(f"Traceback: {error_trace}")
            raise Exception(f"Failed to process message: {str(e)}")
