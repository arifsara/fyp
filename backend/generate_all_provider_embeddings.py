"""
Script to generate embeddings for all existing service providers
Run this once to populate embeddings for all providers in your database

Usage:
    python generate_all_provider_embeddings.py

Make sure:
    1. Backend server is running on http://localhost:8000
    2. Ollama is running with nomic-embed-text model pulled
    3. Database connection is configured correctly
"""
import requests
import os
import sys
from sqlalchemy.orm import Session

# Add backend to path
sys.path.append(os.path.dirname(__file__))

from database import SessionLocal
from models import ServiceProvider

def generate_embeddings():
    """Generate embeddings for all service providers"""
    db: Session = SessionLocal()
    
    try:
        # Get all providers
        providers = db.query(ServiceProvider).all()
        
        if not providers:
            print("No providers found in database.")
            return
        
        print(f"Found {len(providers)} providers to process...\n")
        
        base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        success_count = 0
        error_count = 0
        
        for provider in providers:
            try:
                # Prepare provider data in the format expected by the API
                provider_data = {
                    "full_name": provider.full_name or "",
                    "business_name": provider.business_name or "",
                    "bio": provider.bio or "",
                    "city": provider.city or "",
                    "skills": provider.certificates or "",
                    "services": []  # Can be populated if you have services relationship
                }
                
                # Skip if no meaningful data
                if not provider_data["full_name"] and not provider_data["business_name"] and not provider_data["bio"]:
                    print(f"⚠️  Provider {provider.id}: Skipping (no data)")
                    continue
                
                name = provider_data["full_name"] or provider_data["business_name"] or f"Provider {provider.id}"
                print(f"Processing Provider {provider.id}: {name}...", end=" ")
                
                # Call the API with correct format
                response = requests.post(
                    f"{base_url}/rag/add-provider",
                    json={
                        "provider_id": provider.id,
                        "provider_data": provider_data
                    },
                    timeout=60  # Embedding generation can take time
                )
                
                if response.status_code == 200:
                    print("✅ Success")
                    success_count += 1
                else:
                    print(f"❌ Error {response.status_code}")
                    if response.text:
                        print(f"   {response.text[:100]}")
                    error_count += 1
                    
            except requests.exceptions.ConnectionError:
                print("❌ Connection Error - Is backend running?")
                error_count += 1
                break
            except requests.exceptions.Timeout:
                print("❌ Timeout - Ollama may be slow or not responding")
                error_count += 1
            except Exception as e:
                print(f"❌ Exception: {str(e)}")
                error_count += 1
        
        print(f"\n{'='*60}")
        print(f"✅ Completed: {success_count} successful")
        if error_count > 0:
            print(f"❌ Errors: {error_count}")
        print(f"{'='*60}\n")
        
        if success_count > 0:
            print("🎉 Embeddings generated successfully!")
            print("You can now use the RAG recommendation endpoints.")
        
    except Exception as e:
        print(f"❌ Fatal Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("="*60)
    print("Provider Embedding Generation Script")
    print("="*60)
    print("\nMake sure:")
    print("  1. Backend server is running on http://localhost:8000")
    print("  2. Ollama is running with nomic-embed-text model")
    print("  3. Database connection is configured\n")
    
    input("Press Enter to continue...")
    print()
    
    generate_embeddings()

