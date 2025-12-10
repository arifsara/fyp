"""
Database models for RAG recommendation system
Includes pgvector support for embeddings
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base

# Try to import pgvector, but handle gracefully if not available
try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False
    # Create a dummy Vector class for type hints
    class Vector:
        def __init__(self, *args, **kwargs):
            pass


class UserMessage(Base):
    """Store user messages for chat history"""
    __tablename__ = "user_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Optional: link to chat session
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True)


class ChatSession(Base):
    """Store chat session state"""
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    session_state = Column(JSONB, nullable=True)  # Store conversation context, preferences, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# Note: We'll add embedding column to service_providers table via migration
# The embedding will be stored as a Vector(1536) type using pgvector
