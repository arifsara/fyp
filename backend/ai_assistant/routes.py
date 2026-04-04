from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
import models
import os
import json
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

router = APIRouter(prefix="/api/ai-assistant", tags=["AI Assistant"])

# Initialize models and genai globally so they aren't reloaded every request
# Only load embedding model if it hasn't been loaded yet
try:
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Warning: Failed to load SentenceTransformer: {e}")
    embedding_model = None

# We'll configure Gemini inside the endpoint to allow for dynamic .env loading or check if it exists
def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Gemini API Key is missing. Please configure GEMINI_API_KEY in the environment.")
    
    genai.configure(api_key=api_key)
    # Reverting to explicit string to avoid 404
    return genai.GenerativeModel('gemini-2.5-flash')

@router.post("/")
async def get_ai_recommendation(
    user_message: str = Body(..., embed=True),
    location: str = Body(None, embed=True),
    skin_type: str = Body(None, embed=True),
    budget: str = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    """
    RAG Endpoint: 
    1. Embeds the user query
    2. Searches for Top 5 providers by cosine similarity
    3. Feeds providers and user data into Gemini 2.5 Flash
    4. Returns AI response + direct provider matches
    """
    if not embedding_model:
        raise HTTPException(status_code=500, detail="AI Assistant's embedding model failed to initialize on server start.")
    
    try:
        gemini = get_gemini_model()
    except ValueError as e:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing. Please configure GEMINI_API_KEY in the environment.")

    # Step 1: Generate embeddings for the user's query
    try:
        query_vector = embedding_model.encode(user_message).tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encode query: {e}")

    # Step 2: Vector Search via pgvector (Cosine distance)
    try:
        # Build base query for active providers
        # We also enforce that the embedding is not null
        provider_query = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.is_active == True,
            models.ServiceProvider.embedding.isnot(None)
        )
        
        # If user explicitly provided a location filter, enforce a strict match or 'contains'
        if location and location.strip():
            provider_query = provider_query.filter(models.ServiceProvider.city.ilike(f"%{location}%"))
            
        # Perform similarity search and fetch top 5 closest
        # The pgvector operator `<->` represents L2 distance, `<#>` is inner product, `<=>` is cosine distance
        # We order by cosine distance
        closest_providers = provider_query.order_by(
            models.ServiceProvider.embedding.cosine_distance(query_vector)
        ).limit(5).all()

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database vector search failed: {e}")

    if not closest_providers:
        # Fallback if no providers found
        provider_list_context = "No service providers found matching the user query or location."
        returned_providers = []
    else:
        # Step 3: Format the top providers into a text context for Gemini
        context_lines = []
        returned_providers = []
        for p in closest_providers:
            # Also get services so Gemini knows exact prices
            services = db.query(models.Service).filter(models.Service.provider_id == p.id).all()
            srv_text = ", ".join([f"{s.name} (${s.price})" for s in services])
            
            line = f"- Provider ID: {p.id} | Name: {p.business_name or p.full_name} | City: {p.city} | Specialization/Bio: {p.bio} | Services: {srv_text}"
            context_lines.append(line)
            returned_providers.append({
                "id": p.id,
                "name": p.business_name or p.full_name,
                "city": p.city,
                "services": srv_text
            })
            
        provider_list_context = "\n".join(context_lines)

    # Step 4: Construct the Prompt Engineering for Gemini
    system_prompt = f"""
You are GlowSense, an expert beauty and skincare AI Assistant. 
Your goal is to help a user find the perfect service provider based on their explicit needs.

USER CONTEXT:
- Message: "{user_message}"
- Location Request: "{location or 'Any'}"
- Skin Type: "{skin_type or 'Not specified'}"
- Budget Range: "{budget or 'Not specified'}"

AVAILABLE PROVIDERS (Ranked by semantic relevance to their request):
{provider_list_context}

INSTRUCTIONS:
1. Act as a friendly, professional beauty concierge.
2. Directly answer the user's message using the provided CONTEXT.
3. Recommend 1 to 3 of the BEST matching providers from the list above. Mention their specific services and prices if relevant to the budget.
4. If the user's location does not match any providers, politely inform them.
5. Provide actionable advice for their skin type if applicable.
6. Make the tone warm, welcoming, and confident. 
7. DO NOT invent providers. Only use the names and services explicitly provided in the AVAILABLE PROVIDERS list.
"""

    # Step 5: Send prompt to Gemini API
    try:
        response = gemini.generate_content(system_prompt)
        ai_response_text = response.text
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Fallback to returning just the providers if Gemini fails
        ai_response_text = "I encountered an error connecting to my language processor, but here are the top matching providers I found for you based on your request."

    return {
        "assistant_response": ai_response_text,
        "recommended_providers": returned_providers[:3] # Returning the top 3 IDs explicitly for the frontend UI to parse and show
    }
