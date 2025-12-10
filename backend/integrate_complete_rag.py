"""
Integration script to use the complete RAG system
This updates the existing routes to use the complete RAG service
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Update the existing rag/routes.py to use CompleteRAGService
# Or create a new router that can be included

print("""
To integrate the complete RAG system:

1. Update backend/rag/routes.py to import CompleteRAGService:
   from rag_service_complete import CompleteRAGService as RAGService

2. Or replace the router in main.py:
   from rag_routes_complete import router as rag_router

3. Make sure to run setup_rag_database.sql first
""")

