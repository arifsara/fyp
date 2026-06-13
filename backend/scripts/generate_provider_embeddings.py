import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import event
from database import SessionLocal
import models
from sentence_transformers import SentenceTransformer

# ─── Shared model loader ───────────────────────────────────────────────
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

# ─── For existing providers (manual run) ──────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_embeddings():
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = get_embedding_model()

    db: Session = next(get_db())
    try:
        providers = db.query(models.ServiceProvider).filter(models.ServiceProvider.is_active == True).all()
        print(f"Found {len(providers)} active providers. Generating embeddings...")

        updated_count = 0
        for provider in providers:
            services = db.query(models.Service).filter(models.Service.provider_id == provider.id).all()
            service_details = ", ".join([f"{s.name} (${s.price})" for s in services])

            text_chunks = [
                f"Business/Name: {provider.business_name or provider.full_name}",
                f"Location/City: {provider.city}",
                f"Bio: {provider.bio or 'No bio provided'}",
                f"Services offered: {service_details if service_details else 'No services listed'}",
                f"Experience Level: {provider.level}"
            ]
            combined_text = " | ".join(text_chunks)
            provider.embedding = model.encode(combined_text).tolist()
            updated_count += 1
            print(f"✅ Generated embedding for {provider.business_name or provider.full_name}")

        db.commit()
        print(f"\n🎉 Successfully updated embeddings for {updated_count} providers!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error generating embeddings: {e}")
    finally:
        db.close()

# ─── For new providers (auto events) ──────────────────────────────────
def generate_single_provider_embedding(provider):
    try:
        model = get_embedding_model()
        text_chunks = [
            f"Business/Name: {provider.business_name or provider.full_name}",
            f"Location/City: {provider.city}",
            f"Bio: {provider.bio or 'No bio provided'}",
            f"Services offered: No services listed",
            f"Experience Level: {provider.level}"
        ]
        combined_text = " | ".join(text_chunks)
        provider.embedding = model.encode(combined_text).tolist()
        print(f"✅ Auto-embedding generated for {provider.business_name or provider.full_name}")
    except Exception as e:
        print(f"❌ Failed to generate embedding: {e}")

@event.listens_for(models.ServiceProvider, "before_insert")
def before_insert_provider(mapper, connection, target):
    generate_single_provider_embedding(target)

@event.listens_for(models.ServiceProvider, "after_update")
def after_update_provider(mapper, connection, target):
    generate_single_provider_embedding(target)

# ─── Manual run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    generate_embeddings()