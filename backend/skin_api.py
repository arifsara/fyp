"""
DermLIP Skin Analysis Microservice
====================================
Standalone FastAPI service that loads the DermLIP ViT-B-16 model ONCE at
startup (pre-warm) and exposes an HTTP inference endpoint.

Run:
    python skin_api.py
    -- or --
    uvicorn skin_api:app --host 0.0.0.0 --port 8001

Endpoints:
    GET  /health        → {"status": "ready"} once model is loaded
    POST /analyze       → accepts multipart image, returns top skin conditions
"""

import io
import time
import torch
import open_clip
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_HUB = "hf-hub:redlessone/DermLIP_ViT-B-16"

# Skincare attributes — mirrors test_dermlip.py exactly
ATTRIBUTES = [
    "visible acne",
    "oily shine",
    "dry flaky skin",
    "redness or irritation",
    "dark spots or hyperpigmentation",
    "uneven texture",
    "visible pores",
    "under-eye dark circles",
    "scalp flaking or dandruff",
    "scalp redness",
    "greasy scalp",
]

# Multiple prompt templates per attribute (same as test_dermlip.py)
TEMPLATES = [
    "A close-up photo of skin showing {}.",
    "This photo shows {}.",
    "Visible signs of {}.",
]

TOP_K =2   # Return top 2 conditions for the UI

# ---------------------------------------------------------------------------
# Global model state (loaded at startup)
# ---------------------------------------------------------------------------

_model = None
_preprocess = None
_tokenizer = None
_text_features = None   # precomputed text embeddings (constant across requests)
_model_ready = False


def _load_model():
    """Load DermLIP and pre-compute text embeddings. Called during startup."""
    global _model, _preprocess, _tokenizer, _text_features, _model_ready

    print(f"[skin_api] Loading DermLIP on {DEVICE} …")
    t0 = time.time()

    _model, _, _preprocess = open_clip.create_model_and_transforms(MODEL_HUB)
    _model = _model.to(DEVICE).eval()
    _tokenizer = open_clip.get_tokenizer(MODEL_HUB)

    # Pre-compute text features once — reused for every image request
    prompts = [t.format(a) for a in ATTRIBUTES for t in TEMPLATES]
    text_tokens = _tokenizer(prompts).to(DEVICE)
    with torch.no_grad():
        txt_f = _model.encode_text(text_tokens)
        txt_f = txt_f / txt_f.norm(dim=-1, keepdim=True)
    _text_features = txt_f  # shape: [num_attributes * num_templates, embed_dim]

    _model_ready = True
    print(f"[skin_api] Model ready in {time.time() - t0:.1f}s  (device={DEVICE})")


# ---------------------------------------------------------------------------
# Lifespan — pre-warm on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-warm the model synchronously before accepting any requests."""
    _load_model()
    yield
    # Cleanup (optional)
    print("[skin_api] Shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="DermLIP Skin Analysis Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Main backend will proxy; restrict further if needed
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    if not _model_ready:
        raise HTTPException(status_code=503, detail="Model not ready yet")
    return {"status": "ready", "device": DEVICE}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Accepts a skin image and returns the top-K conditions detected.

    Response:
        {
            "conditions": [
                {"label": "visible acne", "display": "Acne / Breakouts", "score": 0.342, "rank": 1},
                ...
            ],
            "device": "cpu"
        }
    """
    if not _model_ready:
        raise HTTPException(status_code=503, detail="Model is still loading. Please retry in a moment.")

    # Validate file type
    allowed = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Use JPEG, PNG, or WebP."
        )

    # Read and preprocess image
    try:
        raw = await file.read()
        pil_image = Image.open(io.BytesIO(raw)).convert("RGB")
        image_tensor = _preprocess(pil_image).unsqueeze(0).to(DEVICE)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")

    # Inference
    with torch.no_grad():
        img_f = _model.encode_image(image_tensor)
        img_f = img_f / img_f.norm(dim=-1, keepdim=True)

        # Similarity: [1, num_attributes * num_templates]
        sims = (img_f @ _text_features.T).squeeze(0)

    # Average template scores per attribute → [num_attributes]
    sims = sims.view(len(ATTRIBUTES), len(TEMPLATES)).mean(dim=1)

    # Top-K
    k = min(TOP_K, len(ATTRIBUTES))
    topk = torch.topk(sims, k=k)

    conditions = []
    for rank, (score, idx) in enumerate(
        zip(topk.values.tolist(), topk.indices.tolist()), start=1
    ):
        label = ATTRIBUTES[idx]
        conditions.append({
            "label": label,
            "display": label,
            "score": round(score, 4),
            "rank": rank,
        })

    return {"conditions": conditions, "device": DEVICE}

def perform_inference(pil_image):
    """Internal function to run analysis without HTTP overhead."""
    global _model, _preprocess, _text_features
   
    if not _model_ready:
        return None

    # Preprocess and Inference
    image_tensor = _preprocess(pil_image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        img_f = _model.encode_image(image_tensor)
        img_f = img_f / img_f.norm(dim=-1, keepdim=True)
        sims = (img_f @ _text_features.T).squeeze(0)

    sims = sims.view(len(ATTRIBUTES), len(TEMPLATES)).mean(dim=1)
   
    # Top-K logic
    k = min(TOP_K, len(ATTRIBUTES))
    topk = torch.topk(sims, k=k)

    conditions = []
    for rank, (score, idx) in enumerate(zip(topk.values.tolist(), topk.indices.tolist()), start=1):
        label = ATTRIBUTES[idx]
        conditions.append({
            "label": label,
            "display": label,
            "score": round(score, 4),
            "rank": rank,
        })
    return conditions

def is_model_ready():
    return _model_ready


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("skin_api:app", host="0.0.0.0", port=8001, reload=False)
