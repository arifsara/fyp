"""
Generate embeddings for all existing service providers
Run this after setting up the RAG database
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import ServiceProvider
from rag_service_complete import CompleteRAGService


async def generate_all_embeddings():
    """Generate embeddings for all providers without embeddings"""
    db = SessionLocal()
    try:
        rag_service = CompleteRAGService(db)
        
        # Get all providers
        providers = db.query(ServiceProvider).filter(
            ServiceProvider.is_active == True
        ).all()
        
        print(f"Found {len(providers)} active providers")
        print("=" * 60)
        
        success_count = 0
        error_count = 0
        
        for provider in providers:
            try:
                # Check if embedding already exists using raw SQL
                from sqlalchemy import text
                check_result = db.execute(
                    text("SELECT embedding FROM service_providers WHERE id = :id AND embedding IS NOT NULL"),
                    {"id": provider.id}
                )
                if check_result.fetchone():
                    print(f"⏭️  Provider {provider.id} already has embedding, skipping...")
                    continue
                
                # Prepare beautician data
                beautician_data = {
                    "business_name": provider.business_name or "",
                    "full_name": provider.full_name or "",
                    "city": provider.city or "",
                    "bio": provider.bio or "",
                    "rating": 4.5,  # Default rating
                    "experience": 5  # Default experience
                }
                
                # Generate and store embedding
                await rag_service.add_beautician_embedding(
                    provider.id,
                    beautician_data
                )
                success_count += 1
                print(f"✅ Generated embedding for provider {provider.id}: {provider.business_name or provider.full_name}")
                
            except Exception as e:
                error_count += 1
                print(f"❌ Error for provider {provider.id}: {str(e)}")
        
        print("=" * 60)
        print(f"✅ Successfully generated embeddings for {success_count} providers")
        if error_count > 0:
            print(f"❌ Failed for {error_count} providers")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Starting embedding generation for all providers...")
    print("Make sure:")
    print("  1. Ollama is running")
    print("  2. nomic-embed-text model is pulled")
    print("  3. Database has embedding column")
    print("=" * 60)
    
    asyncio.run(generate_all_embeddings())

