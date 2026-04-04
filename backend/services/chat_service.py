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
from ai_assistant.routes import get_gemini_model, embedding_model  # Our new RAG tools
from sqlalchemy import text


class ChatService:
    """Service for managing chat sessions and conversations via Gemini"""
    
    def __init__(self, db: Session):
        self.db = db
    
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
        current_state = dict(session.session_state or {})
        current_state.update(state_updates)
        session.session_state = current_state
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(session, "session_state")
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
            
            current_state = session.session_state or {}
            session_messages = current_state.get("messages", [])
            
            # Add user message to session memory array
            session_messages.append({
                "role": "user",
                "content": message,
                "timestamp": user_msg.timestamp.isoformat()
            })
            
            # Get recent messages for context
            recent_messages = self.db.query(UserMessage).filter(
                UserMessage.session_id == session.id
            ).order_by(desc(UserMessage.timestamp)).limit(10).all()
            
            # STEP 3: Embed using the new local sentence-transformer
            import traceback
            try:
                if embedding_model is None:
                    raise Exception("embedding_model is not loaded.")
                query_embedding = embedding_model.encode(message).tolist()
                embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            except Exception as e:
                raise Exception(f"Failed to generate embedding: {e}")

            # STEP 4: Pgvector search directly in chat
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
                    1 - (sp.embedding <=> CAST(:query_embedding AS vector)) as similarity
                FROM service_providers sp
                WHERE sp.embedding IS NOT NULL
                  AND sp.is_active = true
                ORDER BY sp.embedding <=> CAST(:query_embedding AS vector)
                LIMIT 5
            """)
            
            result = self.db.execute(query, {
                "query_embedding": embedding_str
            })
            
            similar_providers = []
            for row in result:
                # Need to also fetch services roughly
                services = self.db.execute(text("SELECT name, price FROM services WHERE provider_id = :pid"), {"pid": row.id}).fetchall()
                srv_text = ", ".join([f"{s.name} (${s.price})" for s in services])
                
                similar_providers.append({
                    "id": row.id,
                    "business_name": row.business_name,
                    "full_name": row.full_name,
                    "bio": row.bio,
                    "city": row.city,
                    "services": srv_text,
                    "similarity": float(row.similarity) if row.similarity else 0.0
                })

            provider_json = json.dumps(similar_providers, indent=2, default=str)

            # STEP 5: Prepare conversation history for Gemini context
            # Get the last 10 messages from the purely tracked session memory (excluding the current user message just appended)
            history_messages = session_messages[-11:-1]
            history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in history_messages])

            # STEP 6: Call Google Gemini directly
            try:
                gemini = get_gemini_model()
            except ValueError:
                 raise Exception("Gemini API key is missing. Please add GEMINI_API_KEY to .env")

            system_prompt = f"""
You are GlowSense AI, an expert beauty concierge.
Help the user schedule appointments and find service providers based on their query.

Conversation Context:
{history_text}

Current User Message: {message}

Recommended Matching Providers from Database:
{provider_json}

Instructions:
1. Act friendly and welcoming.
2. Directly address the user's current message.
3. Recommend 1 to 3 of the BEST matching providers from the list. Mention their skills/prices.
4. DO NOT invent providers.
"""
            
            try:
                response = gemini.generate_content(system_prompt)
                ai_response = response.text
            except Exception as e:
                traceback.print_exc()
                ai_response = "I encountered an error generating my response via Gemini, but found some providers matching your request behind the scenes."

            # Store AI response
            ai_message = UserMessage(
                user_id=user_id,
                message=ai_response,
                session_id=session.id
            )
            self.db.add(ai_message)
            self.db.commit() # Important to commit the message!
            
            # Update session memory array with Assistant response including providers
            session_messages.append({
                "role": "assistant",
                "content": ai_response,
                "providers": similar_providers,
                "timestamp": ai_message.timestamp.isoformat()
            })
            
            # Update session state
            self.update_session_state(session, {
                "messages": session_messages[-30:], # Keep the trailing history safely capped
                "last_recommendations": similar_providers
            })
            
            return {
                "response": ai_response,
                "providers": similar_providers,
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
