"""
Skin Analysis Routes
=====================
Provides:
  POST /skin/analyze   — authenticated; proxies image to DermLIP ML service,
                         saves text results (no image stored), returns conditions
  GET  /skin/history   — paginated list of past analyses for the current customer
  GET  /skin/health    — check whether the ML service is reachable
"""

import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from typing import List, Optional

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
import auth
import database
import google.generativeai as genai

router = APIRouter(prefix="/skin", tags=["Skin Analysis"])
security = HTTPBearer()

# URL of the running DermLIP ML microservice
ML_SERVICE_URL = os.getenv("SKIN_ML_SERVICE_URL", "http://localhost:8001")

# Configure Gemini for skincare recommendations dynamically
def get_analysis_model():
    analysis_key = "AIzaSyD0J4iL8uf2xpjdFs4JhOCmlI4l2YIB0Wo"
    if not analysis_key:
        print("Warning: 'AnalysisKey' not found in .env. AI recommendations disabled.")
        return None
    genai.configure(api_key=analysis_key)
    # Using gemini-1.5-flash for fast, structured responses
    return genai.GenerativeModel('gemini-2.5-flash')

# Shared httpx client (connection pooling)
_http_client: Optional[httpx.AsyncClient] = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=120.0)   # 2-min timeout for first inference
    return _http_client


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db),
) -> models.Customer:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "customer":
            raise HTTPException(status_code=401, detail="Customer authentication required")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    customer = db.query(models.Customer).filter(models.Customer.email == email).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/health")
async def skin_service_health():
    """Check whether the DermLIP ML microservice is ready."""
    try:
        client = _get_http_client()
        resp = await client.get(f"{ML_SERVICE_URL}/health", timeout=5.0)
        resp.raise_for_status()
        return {"ml_service": "ready", "detail": resp.json()}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"ML service unavailable: {str(e)}. "
                   f"Ensure skin_api.py is running on {ML_SERVICE_URL}."
        )


async def generate_ai_recommendations(conditions: List[dict]) -> dict:
    """
    Call Gemini to generate a skincare routine based on identified conditions.
    """
    model_ai = get_analysis_model()
    
    if not model_ai:
        return {
            "morning_routine": ["Wash your face with a gentle cleanser.", "Apply moisturizer.", "Use SPF."],
            "night_routine": ["Double cleanse to remove impurities.", "Apply moisturizer.", "Use targeted treatment if needed."],
            "products": ["Centella Asiatica (for soothing)", "Hyaluronic Acid (for hydration)"]
        }

    # Format conditions for the prompt
    cond_text = ", ".join([f"{c.get('display', 'Unknown condition')} (confidence: {round(c.get('score', 0.0) * 100, 1)}%)" for c in conditions[:3]])
    
    prompt = f"""
    You are a professional Dermatologist AI Assistant called GlowSense. 
    A customer has just performed a skin analysis. Their top skin concerns have been strictly identified as: {cond_text}.
    
    Based SPECIFICALLY on these unique skin concerns, generate a highly specialized and personalized skincare plan.
    You MUST tailor the recommendations to the exactly identified conditions and avoid pure generic fallbacks.

    The response must EXCLUSIVELY be a Valid JSON object with exactly these keys:
    - "morning_routine" (list of 3-4 string steps)
    - "night_routine" (list of 3-4 string steps)
    - "products" (list of 3-4 specific active ingredients and affordable brand products that have these ingredients and are available in Pakistan)
    
    Do not include any formatting backticks, markdown, or chat text outside the JSON object.
    """

    try:
        # We use a 15s timeout for the AI response
        response = model_ai.generate_content(prompt)
        # Attempt to parse JSON from the response (Gemini sometimes includes markdown backticks)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return {
            "morning_routine": [f"API ERROR: {str(e)}", "Please check your backend / API key."],
            "night_routine": ["Gemini Failure", str(e)],
            "products": ["Error", type(e).__name__]
        }


@router.post("/analyze")
async def analyze_skin(
    file: UploadFile = File(...),
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db),
):
    """
    Upload a skin image → get top conditions from DermLIP.
    Then, call Gemini to generate a personalized skincare routine.
    Results are saved to the database (text results + AI recommendations).
    """
    # Validate file type early
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Please upload a JPEG, PNG, or WebP image."
        )

    # Read image bytes
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Forward to ML service
    try:
        client = _get_http_client()
        resp = await client.post(
            f"{ML_SERVICE_URL}/analyze",
            files={"file": (file.filename, image_bytes, file.content_type)},
            timeout=120.0,
        )
        if resp.status_code == 503:
            raise HTTPException(status_code=503, detail="ML model is still loading. Please try again.")
        resp.raise_for_status()
        ml_result = resp.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not reach ML service: {str(e)}")

    conditions = ml_result.get("conditions", [])

    # Step 2: Generate AI Recommendations via Gemini
    recommendations = await generate_ai_recommendations(conditions)

    # Prepare final result structure
    final_results = {
        "conditions": conditions,
        "recommendations": recommendations
    }

    # Persist results in DB
    analysis = models.SkinAnalysis(
        customer_id=current_customer.id,
        results=json.dumps(final_results),
        image_url=None,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "conditions": conditions,
        "recommendations": recommendations,
        "created_at": analysis.created_at.isoformat(),
    }


@router.get("/history")
async def get_skin_history(
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    """
    Return the logged-in customer's past skin analyses, newest first.
    """
    total = db.query(models.SkinAnalysis).filter(
        models.SkinAnalysis.customer_id == current_customer.id
    ).count()

    analyses = (
        db.query(models.SkinAnalysis)
        .filter(models.SkinAnalysis.customer_id == current_customer.id)
        .order_by(models.SkinAnalysis.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for a in analyses:
        try:
            data_json = json.loads(a.results)
            # Handle new format: {"conditions": [], "recommendations": {}}
            if isinstance(data_json, dict) and "conditions" in data_json:
                conds = data_json["conditions"]
                recs = data_json.get("recommendations")
            else:
                # Handle old format: [...]
                conds = data_json
                recs = None
        except Exception:
            conds = []
            recs = None

        results.append({
            "analysis_id": a.id,
            "conditions": conds,
            "recommendations": recs,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    return {"total": total, "analyses": results}
