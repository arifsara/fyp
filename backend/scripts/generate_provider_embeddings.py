import sys
import os

# Add the parent directory (backend root) to sys.path so we can import 'database' and 'models'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal
import models
from sentence_transformers import SentenceTransformer

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_embeddings():
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    try:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as e:
        print(f"Failed to load embedding model: {e}")
        return

    # Create a database session
    db: Session = next(get_db())
    
    try:
        # Fetch all active service providers
        providers = db.query(models.ServiceProvider).filter(models.ServiceProvider.is_active == True).all()
        print(f"Found {len(providers)} active providers. Generating embeddings...")

        updated_count = 0
        for provider in providers:
            # Gather associated services
            services = db.query(models.Service).filter(models.Service.provider_id == provider.id).all()
            
            # Create a rich text representation of the provider
            service_details = ", ".join([f"{s.name} (${s.price})" for s in services])
            
            text_chunks = [
                f"Business/Name: {provider.business_name or provider.full_name}",
                f"Location/City: {provider.city}",
                f"Bio: {provider.bio or 'No bio provided'}",
                f"Services offered: {service_details if service_details else 'No services listed'}",
                f"Experience Level: {provider.level}"
            ]
            
            combined_text = " | ".join(text_chunks)
            
            # Generate the 384-dimensional embedding
            embedding_vector = model.encode(combined_text).tolist()
            
            # Save it back to the database
            provider.embedding = embedding_vector
            updated_count += 1
            
            print(f"✅ Generated embedding for {provider.business_name or provider.full_name}")

        db.commit()
        print(f"\n🎉 Successfully updated embeddings for {updated_count} providers!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error generating embeddings: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_embeddings()
