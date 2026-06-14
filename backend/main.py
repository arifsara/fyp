# Fast imports first (these can be slow on some systems)
import os
import sys
print("Loading FastAPI...", flush=True)
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
print("Loading middleware...", flush=True)
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
print("Loading database...", flush=True)
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import shutil
import uuid
from dotenv import load_dotenv
import httpx
import scripts.generate_provider_embeddings
import skin_api
# Google OAuth (ID token verification)
try:
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
except Exception:
    google_id_token = None  # type: ignore
    google_requests = None  # type: ignore

# Load environment variables from .env file
load_dotenv()

print("Loading modules...", flush=True)
import models, auth, database
import booking_utils
import notifications
import google_calendar


from jose import jwt, JWTError

# Stripe Payment Integration (optional - gracefully handle if not installed)
stripe = None
try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    if stripe.api_key:
        print("Stripe payment integration enabled")
    else:
        print(" Stripe secret key not set. Payment functionality disabled.")
        stripe = None
except ImportError:
    print("Stripe not installed. Payment functionality disabled.")
    stripe = None

# Optional: APScheduler for reminders (gracefully handle if not installed)
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    scheduler = AsyncIOScheduler()
    print(" APScheduler available for booking reminders")
except ImportError:
    scheduler = None
    print(" APScheduler not installed. Reminder functionality will be limited.")


try:
    print("🔄 Connecting to database...")
    # Test connection first (with timeout)
    from sqlalchemy import text
    with database.engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Database connection successful")
    
    # Create tables (non-blocking)
    models.Base.metadata.create_all(bind=database.engine)
    print(" Database tables ready")
except Exception as e:
    print(f" Database connection issue: {e}")
    print(" Server will start but database operations may fail")
    print(" Please ensure PostgreSQL is running and connection string is correct")

# Setup Upload Directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/portfolio", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/profile", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/documents", exist_ok=True)

app = FastAPI()

# --- Include modular routers ---
from ratings.routes import router as ratings_router
from admin.routes import router as admin_router
from standby.routes import router as standby_router
from ai_assistant.routes import router as ai_assistant_router
from skin_analysis.routes import router as skin_analysis_router
app.include_router(ratings_router)
app.include_router(admin_router)
app.include_router(standby_router)
app.include_router(ai_assistant_router)
app.include_router(skin_analysis_router)

# Startup event to initialize scheduler
@app.on_event("startup")
async def startup_event():
    """Initialize scheduler when app starts"""
    print("🚀 Loading Skin Analysis AI Model...")
    skin_api._load_model()
    if scheduler:
        try:
            scheduler.start()
            print(" APScheduler started for booking reminders")
        except Exception as e:
            print(f" Failed to start scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown scheduler when app stops"""
    if scheduler:
        try:
            scheduler.shutdown()
            print(" APScheduler stopped")
        except Exception as e:
            print(f" Error stopping scheduler: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://glowsenseai-kappa.vercel.app","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Security
security = HTTPBearer()

# Google OAuth config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


# Dependency to get current provider from token
def get_current_provider(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "provider":
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.email == email).first()
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

# --- Pydantic Schemas ---
class CustomerCreate(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    location: Optional[str] = None  # Customer location/city
    id_token: Optional[str] = None

class ProviderCreate(BaseModel):
    email: str
    password: str  # Required for signup
    full_name: str
    phone: str
    business_name: str
    city: str
    bio: Optional[str] = None
    cnic_id: Optional[str] = None
    certificates: Optional[str] = None
    business_license: Optional[str] = None
    id_token: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str  # 'customer' or 'provider'

class ExtendedProviderCreate(ProviderCreate):
    profile_photo: Optional[str] = None
    portfolio_items: Optional[List[dict]] = None
    services: Optional[List[dict]] = None

class ServiceCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    price: str
    duration: str
    availability_schedule: Optional[dict] = None

class PortfolioItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    experience_details: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class TimeSlotCreate(BaseModel):
    day: str  # e.g., "monday", "tuesday", etc. (for legacy weekly schedule)
    start_time: str  # e.g., "09:00" (for legacy weekly schedule)
    end_time: str  # e.g., "17:00" (for legacy weekly schedule)
    is_available: bool = True

class TimeSlotAdd(BaseModel):
    """Model for adding individual time slots (date + time)"""
    service_id: int
    slot_datetime: str  # ISO format datetime string
    is_available: bool = True

class TimeSlotBulkAdd(BaseModel):
    """Model for bulk adding time slots"""
    service_id: int
    start_date: str  # ISO format date string
    end_date: str  # ISO format date string (max 3 months from start)
    days_of_week: List[int]  # 0=Monday, 6=Sunday
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    interval_minutes: int = 30  # Interval between slots

class BookingCreate(BaseModel):
    service_id: int
    time_slot_id: int  # Reference to time slot
    notes: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str  # "confirmed", "rejected", "cancelled", "completed"

class PaymentIntentCreate(BaseModel):
    booking_id: int

class PaymentConfirm(BaseModel):
    payment_intent_id: str
    booking_id: int


class GoogleAuthRequest(BaseModel):
    """Payload for Google OAuth sign-in from frontend (ID token based)."""
    id_token: str
    role: str  # "customer" or "provider"
    intent: str  # "login" or "signup"


# --- CUSTOMER Routes ---

@app.post("/signup/customer", response_model=Token)
async def signup_customer(user: CustomerCreate, db: Session = Depends(database.get_db)):
    try:
        import re
        
        # Check if email exists in Customer table
        if db.query(models.Customer).filter(models.Customer.email == user.email).first():
            raise HTTPException(status_code=400, detail="Email already registered as Customer")

        # Validate name (only letters and spaces)
        if not user.full_name or not user.full_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required.")
        
        name_clean = user.full_name.strip()
        if not re.match(r'^[a-zA-Z\s]+$', name_clean):
            raise HTTPException(status_code=400, detail="Name should only contain letters and spaces (no numbers or special characters).")
        
        # Validate phone number (11 digits, numeric only)
        if not user.phone or not user.phone.strip():
            raise HTTPException(status_code=400, detail="Phone number is required.")
        
        phone_clean = re.sub(r'[\s\-()]', '', user.phone.strip())  # Remove spaces, dashes, parentheses
        if not re.match(r'^\d+$', phone_clean):
            raise HTTPException(status_code=400, detail="Phone number should contain only numeric values.")
        
        if len(phone_clean) != 11:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 11 digits.")

        # Validate password
        if not user.password:
            raise HTTPException(status_code=400, detail="Password is required for signup.")
        
        password_clean = user.password.strip()
        if not password_clean:
            raise HTTPException(status_code=400, detail="Password cannot be empty or only whitespace.")
        
        if len(password_clean) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password_clean):
            raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

        hashed_pwd = auth.get_password_hash(password_clean)
        
        google_id = None
        picture = None
        if user.id_token:
            try:
                idinfo = _verify_google_id_token(user.id_token)
                google_id = idinfo.get("sub")
                picture = idinfo.get("picture")
            except Exception as e:
                print(f"Warning: Failed to verify id_token during customer signup: {e}")
    
        new_user = models.Customer(
            email=user.email, 
            full_name=name_clean, 
            phone=phone_clean,
            location=user.location,
            hashed_password=hashed_pwd,
            google_id=google_id,
            profile_picture=picture
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = auth.create_access_token(data={"sub": new_user.email, "role": "customer"})
        return {"access_token": access_token, "token_type": "bearer", "role": "customer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in customer signup: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/login/customer", response_model=Token)
async def login_customer(user: LoginRequest, db: Session = Depends(database.get_db)):
    # STRICT CHECK: Only look in Customer table
    # Using .first() with indexed email column for fast lookup
    db_user = db.query(models.Customer).filter(models.Customer.email == user.email).first()
    
    if not db_user:
        # Use same error message to prevent email enumeration
        raise HTTPException(status_code=400, detail="Invalid customer credentials")
    
    # Check if account has no password (invalid account)
    if db_user.hashed_password is None:
        raise HTTPException(status_code=400, detail="Account setup incomplete. Please contact support.")
    
    # Verify password for regular users (Argon2 verification is optimized)
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid customer credentials")
    
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": "customer", "customer_id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": "customer"}


def _verify_google_id_token(id_token_str: str) -> dict:
    """Verify Google ID token and return decoded payload."""
    if not google_id_token or not google_requests:
        raise HTTPException(status_code=503, detail="Google OAuth libraries are not available on the server.")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="GOOGLE_CLIENT_ID is not configured on the server.")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {e}")

    if not idinfo.get("email"):
        raise HTTPException(status_code=400, detail="Google token does not contain an email address.")
    if not idinfo.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Google email address is not verified.")

    return idinfo


@app.post("/auth/google")
async def google_auth(
    payload: GoogleAuthRequest,
    db: Session = Depends(database.get_db),
):
    """
    Unified Google OAuth entry point for both login and signup flows.

    Frontend sends an ID token obtained from Google Identity Services.
    - intent = "login": if user exists and is active → issue JWT and log them in.
                        if not exists → tell frontend to redirect to signup with pre-filled email.
    - intent = "signup": just verify token and return profile info so signup forms can be pre-filled.
    """
    intent = payload.intent.lower().strip()
    role = payload.role.lower().strip()

    if role not in {"customer", "provider"}:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'customer' or 'provider'.")
    if intent not in {"login", "signup"}:
        raise HTTPException(status_code=400, detail="Invalid intent. Must be 'login' or 'signup'.")

    idinfo = _verify_google_id_token(payload.id_token)

    email = idinfo.get("email")
    google_sub = idinfo.get("sub")
    full_name = idinfo.get("name")
    picture = idinfo.get("picture")

    Model = models.Customer if role == "customer" else models.ServiceProvider

    user = db.query(Model).filter(Model.email == email).first()

    # For signup intent: we never create the user here. We only return verified info
    # so the frontend can prefill the form with a locked email.
    if intent == "signup":
        return {
            "email": email,
            "name": full_name,
            "google_id": google_sub,
            "picture": picture,
            "role": role,
            "already_registered": bool(user),
        }

    # intent == "login"
    if not user:
        # No account exists – frontend should redirect the user to appropriate signup page
        # with pre-filled, non-editable email.
        return {
            "needs_signup": True,
            "email": email,
            "name": full_name,
            "google_id": google_sub,
            "picture": picture,
            "role": role,
        }

    # Ensure user is active / approved
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=403, detail="Account is not approved or is inactive.")

    # Link Google account to existing user record (id + picture) if not already linked
    updated = False
    if hasattr(user, "google_id") and not user.google_id and google_sub:
        user.google_id = google_sub
        updated = True
    # Customers and providers both have profile_picture field (provider also has profile_photo)
    if picture and hasattr(user, "profile_picture") and not user.profile_picture:
        user.profile_picture = picture  # type: ignore
        updated = True

    if updated:
        db.add(user)
        db.commit()
        db.refresh(user)

    token_data = {"sub": user.email, "role": role}
    if role == "customer":
        token_data["customer_id"] = user.id
    else:
        token_data["provider_id"] = user.id

    access_token = auth.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer", "role": role}

# --- SERVICE PROVIDER Routes ---

@app.post("/signup/provider", response_model=Token)
async def signup_provider(user: ProviderCreate, db: Session = Depends(database.get_db)):
    try:
        import re
        
        # Check if email exists in Provider table
        if db.query(models.ServiceProvider).filter(models.ServiceProvider.email == user.email).first():
            raise HTTPException(status_code=400, detail="Email already registered as Provider")

        # Validate name (only letters and spaces)
        if not user.full_name or not user.full_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required.")
        
        name_clean = user.full_name.strip()
        if not re.match(r'^[a-zA-Z\s]+$', name_clean):
            raise HTTPException(status_code=400, detail="Name should only contain letters and spaces (no numbers or special characters).")
        
        # Validate phone number (11 digits, numeric only)
        if not user.phone or not user.phone.strip():
            raise HTTPException(status_code=400, detail="Phone number is required.")
        
        phone_clean = re.sub(r'[\s\-()]', '', user.phone.strip())  # Remove spaces, dashes, parentheses
        if not re.match(r'^\d+$', phone_clean):
            raise HTTPException(status_code=400, detail="Phone number should contain only numeric values.")
        
        if len(phone_clean) != 11:
            raise HTTPException(status_code=400, detail="Phone number must be exactly 11 digits.")

        # Validate CNIC (13 digits, numeric only) - if provided
        if user.cnic_id and user.cnic_id.strip():
            cnic_clean = re.sub(r'[\s\-]', '', user.cnic_id.strip())  # Remove spaces and dashes
            if not re.match(r'^\d+$', cnic_clean):
                raise HTTPException(status_code=400, detail="CNIC should contain only numeric values.")
            
            if len(cnic_clean) != 13:
                raise HTTPException(status_code=400, detail="CNIC must be exactly 13 digits.")

        # Validate password
        if not user.password:
            raise HTTPException(status_code=400, detail="Password is required for signup.")
        
        password_clean = user.password.strip()
        if not password_clean:
            raise HTTPException(status_code=400, detail="Password cannot be empty or only whitespace.")
        
        if len(password_clean) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password_clean):
            raise HTTPException(status_code=400, detail="Password must contain at least one special character.")
        
        # Hash password
        hashed_pwd = auth.get_password_hash(password_clean)
    
        # Clean CNIC if provided
        cnic_clean = None
        if user.cnic_id and user.cnic_id.strip():
            cnic_clean = re.sub(r'[\s\-]', '', user.cnic_id.strip())
            
        google_id = None
        picture = None
        if user.id_token:
            try:
                idinfo = _verify_google_id_token(user.id_token)
                google_id = idinfo.get("sub")
                picture = idinfo.get("picture")
            except Exception as e:
                print(f"Warning: Failed to verify id_token during provider signup: {e}")
    
        new_provider = models.ServiceProvider(
            email=user.email, 
            full_name=name_clean, 
            phone=phone_clean,
            business_name=user.business_name,
            city=user.city,
            bio=user.bio,
            cnic_id=cnic_clean,
            certificates=user.certificates,
            business_license=user.business_license,
            hashed_password=hashed_pwd,
            level="beginner",
            google_id=google_id,
            profile_picture=picture
        )
        db.add(new_provider)
        db.commit()
        db.refresh(new_provider)

        # Create Stripe Express connected account for payouts (optional but recommended)
        if stripe:
            try:
                connect_country = os.getenv("STRIPE_CONNECT_COUNTRY", "US")
                account = stripe.Account.create(
                    type="express",
                    country=connect_country,
                    email=new_provider.email,
                    capabilities={
                        "card_payments": {"requested": True},
                        "transfers": {"requested": True},
                    },
                    business_type="individual",
                )
                new_provider.stripe_account_id = account.id
                new_provider.stripe_onboarding_complete = False
                db.commit()
                db.refresh(new_provider)
            except Exception as e:
                print(f"Warning: Failed to create Stripe connected account for provider {new_provider.id}: {e}")
        access_token = auth.create_access_token(data={"sub": new_provider.email, "role": "provider", "provider_id": new_provider.id})
        return {"access_token": access_token, "token_type": "bearer", "role": "provider"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in provider signup: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/login/provider", response_model=Token)
async def login_provider(user: LoginRequest, db: Session = Depends(database.get_db)):
    # STRICT CHECK: Only look in Provider table
    db_user = db.query(models.ServiceProvider).filter(models.ServiceProvider.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid provider credentials")
    
    # Check if account has no password (invalid account)
    if db_user.hashed_password is None:
        raise HTTPException(status_code=400, detail="Account setup incomplete. Please contact support.")
    
    # Verify password for regular users
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid provider credentials")
    
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": "provider", "provider_id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": "provider"}

# --- File Upload Routes ---

@app.post("/upload/portfolio")
async def upload_portfolio(file: UploadFile = File(...)):
    file_ext = file.filename.split(".")[-1]
    allowed_exts = ["jpg", "jpeg", "png", "gif", "mp4", "mov", "webm"]
    
    if file_ext.lower() not in allowed_exts:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    file_path = f"{UPLOAD_DIR}/portfolio/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/{file_path}", "filename": file.filename}

@app.post("/upload/profile")
async def upload_profile(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db)
):
    """Upload profile photo - works for both providers and customers"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or role not in ("provider", "customer"):
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    os.makedirs(f"{UPLOAD_DIR}/profile", exist_ok=True)
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"{UPLOAD_DIR}/profile/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Auto-update the profile photo in DB based on role
    if role == "provider":
        provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.email == email).first()
        if provider:
            provider.profile_photo = f"/{file_path}"
            provider.profile_picture = f"/{file_path}"
            db.commit()
    elif role == "customer":
        customer = db.query(models.Customer).filter(models.Customer.email == email).first()
        if customer:
            customer.profile_picture = f"/{file_path}"
            db.commit()

    return {"url": f"/{file_path}", "filename": unique_filename}

@app.post("/upload/documents")
async def upload_documents(file: UploadFile = File(...)):
    """Upload certificates, licenses, or other documents (PDF, images)"""
    file_ext = file.filename.split(".")[-1]
    allowed_exts = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]
    
    if file_ext.lower() not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"File type .{file_ext} not allowed. Allowed: PDF, images, DOC")
    
    # Create documents directory
    os.makedirs(f"{UPLOAD_DIR}/documents", exist_ok=True)
    
    file_path = f"{UPLOAD_DIR}/documents/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/{file_path}", "filename": file.filename}

# --- Portfolio Management Routes (For Providers) ---

@app.post("/provider/portfolio")
async def add_portfolio_item(item: PortfolioItemCreate, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    portfolio_item = models.PortfolioItem(
        provider_id=current_provider.id,
        title=item.title,
        description=item.description,
        experience_details=item.experience_details,
        image_url=item.image_url,
        video_url=item.video_url
    )
    db.add(portfolio_item)
    db.commit()
    db.refresh(portfolio_item)
    return {"id": portfolio_item.id, "message": "Portfolio item added"}

@app.get("/provider/portfolio")
async def get_portfolio(current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    items = db.query(models.PortfolioItem).filter(models.PortfolioItem.provider_id == current_provider.id).all()
    return [
        {
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "experience_details": i.experience_details,
            "image_url": i.image_url,
            "video_url": i.video_url
        } for i in items
    ]

@app.put("/provider/portfolio/{item_id}")
async def update_portfolio_item(item_id: int, item: PortfolioItemCreate, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    db_item = db.query(models.PortfolioItem).filter(models.PortfolioItem.id == item_id, models.PortfolioItem.provider_id == current_provider.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db_item.title = item.title
    db_item.description = item.description
    db_item.experience_details = item.experience_details
    if item.image_url:
        db_item.image_url = item.image_url
    if item.video_url:
        db_item.video_url = item.video_url
    
    db.commit()
    db.refresh(db_item)
    return {
        "message": "Updated", 
        "item": {
            "id": db_item.id,
            "title": db_item.title,
            "description": db_item.description,
            "experience_details": db_item.experience_details,
            "image_url": db_item.image_url,
            "video_url": db_item.video_url
        }
    }

@app.delete("/provider/portfolio/{item_id}")
async def delete_portfolio_item(item_id: int, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    item = db.query(models.PortfolioItem).filter(models.PortfolioItem.id == item_id, models.PortfolioItem.provider_id == current_provider.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Service Management Routes ---

@app.post("/provider/services")
async def add_service(service: ServiceCreate, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    new_service = models.Service(
        provider_id=current_provider.id,
        name=service.name,
        category=service.category,
        description=service.description,
        price=service.price,
        duration=service.duration,
        availability_schedule=json.dumps(service.availability_schedule) if service.availability_schedule else None
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return {"id": new_service.id, "message": "Service added"}

@app.get("/provider/services")
async def get_services(current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    services = db.query(models.Service).filter(models.Service.provider_id == current_provider.id).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "description": s.description,
            "price": s.price,
            "duration": s.duration,
            "availability_schedule": json.loads(s.availability_schedule) if s.availability_schedule else None
        } for s in services
    ]

@app.put("/provider/services/{service_id}")
async def update_service(service_id: int, service: ServiceCreate, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    db_service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.provider_id == current_provider.id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db_service.name = service.name
    db_service.category = service.category
    db_service.description = service.description
    db_service.price = service.price
    db_service.duration = service.duration
    db_service.availability_schedule = json.dumps(service.availability_schedule) if service.availability_schedule else None
    
    db.commit()
    return {"message": "Service updated"}

@app.delete("/provider/services/{service_id}")
async def delete_service(service_id: int, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.provider_id == current_provider.id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted"}

@app.get("/provider/bookings")
async def get_provider_bookings(current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Get all bookings for the provider (including ones they originally had before standby reassignment)"""
    from sqlalchemy import or_
    bookings = db.query(models.Booking).filter(
        or_(
            models.Booking.provider_id == current_provider.id,
            models.Booking.original_provider_id == current_provider.id,
        )
    ).order_by(models.Booking.booking_date.desc()).all()
    
    # Include customer and service details
    result = []
    for booking in bookings:
        customer = db.query(models.Customer).filter(models.Customer.id == booking.customer_id).first()
        service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
        result.append({
            "id": booking.id,
            "customer": {
                "id": customer.id if customer else None,
                "full_name": customer.full_name if customer else None,
                "email": customer.email if customer else None,
                "phone": customer.phone if customer else None,
            },
            "service": {
                "id": service.id if service else None,
                "name": service.name if service else None,
                "price": service.price if service else None,
            },
            "booking_date": booking.booking_date,
            "status": booking.status,
            "notes": booking.notes,
            "created_at": booking.created_at,
            "payment_status": booking.payment_status if hasattr(booking, 'payment_status') else "UNPAID",
            "booking_status": getattr(booking, "booking_status", None),
            "original_provider_id": getattr(booking, "original_provider_id", None),
            "assigned_provider_id": getattr(booking, "assigned_provider_id", None),
        })
    return result

@app.put("/provider/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    background_tasks: BackgroundTasks,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Update booking status (accept/reject/cancel) with Google Calendar integration"""
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.provider_id == current_provider.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if status_update.status not in ["accepted", "confirmed", "rejected", "cancelled", "completed", "cancelled_by_provider", "standby_selected", "standby_pending", "awaiting_extra_payment"]:
        raise HTTPException(status_code=400, detail="Invalid status.")
    
    old_status = booking.status
    
    # When provider accepts, set status to "accepted" (not "confirmed")
    # Booking becomes "confirmed" only after payment has succeeded and funds are in escrow.
    if status_update.status == "confirmed":
        # Only allow setting to "confirmed" if payment is already captured/held in escrow
        if booking.payment_status not in ["HELD_IN_ESCROW", "RELEASED_TO_PROVIDER"]:
            raise HTTPException(
                status_code=400, 
                detail="Cannot confirm booking. Payment must be completed and held in escrow first. Use 'accepted' status to approve the booking."
            )
    
    booking.status = status_update.status
    booking.booking_status = status_update.status
    
    # Get customer and service for notifications
    customer = db.query(models.Customer).filter(models.Customer.id == booking.customer_id).first()
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    
    provider_tz = current_provider.timezone or "UTC"
    booking_date_local = booking_utils.convert_to_timezone(booking.booking_date, provider_tz)
    
    # Google Calendar integration - only create event when booking is confirmed (after payment)
    if status_update.status == "confirmed" and booking.payment_status in ["HELD_IN_ESCROW", "RELEASED_TO_PROVIDER"] and current_provider.google_calendar_access_token:
        # Create calendar event
        if not booking.google_calendar_event_id:
            event_id = google_calendar.create_booking_calendar_event(
                access_token=current_provider.google_calendar_access_token,
                refresh_token=current_provider.google_calendar_refresh_token,
                customer_name=customer.full_name or "Customer",
                customer_email=customer.email,
                provider_name=current_provider.full_name or current_provider.business_name,
                service_name=service.name if service else "Service",
                booking_date=booking.booking_date,
                end_date=booking.end_date or booking_utils.calculate_end_time(booking.booking_date, service.duration if service else "60 minutes"),
                notes=booking.notes,
                location=current_provider.city
            )
            if event_id:
                booking.google_calendar_event_id = event_id
        
        # Schedule reminder (if scheduler is available)
        if scheduler and booking.booking_date > datetime.now(ZoneInfo("UTC")):
            reminder_time = booking.booking_date - timedelta(hours=24)
            if reminder_time > datetime.now(ZoneInfo("UTC")):
                scheduler.add_job(
                    notifications.notify_booking_reminder,
                    'date',
                    run_date=reminder_time,
                    args=[
                        customer.email,
                        customer.phone,
                        customer.full_name or "Customer",
                        current_provider.full_name or current_provider.business_name,
                        service.name if service else "Service",
                        booking_date_local,
                        24
                    ]
                )
    
    elif status_update.status in ["cancelled", "rejected"] and booking.google_calendar_event_id:
        # Cancel/delete calendar event
        if current_provider.google_calendar_access_token:
            service_obj = google_calendar.get_google_calendar_service(
                current_provider.google_calendar_access_token,
                current_provider.google_calendar_refresh_token
            )
            if service_obj:
                google_calendar.update_calendar_event(
                    service_obj,
                    booking.google_calendar_event_id,
                    status="cancelled"
                )
    
    # Free up time slot when booking is cancelled or rejected
    if status_update.status in ["cancelled", "rejected", "cancelled_by_provider"] and booking.time_slot_id:
        time_slot = db.query(models.TimeSlot).filter(models.TimeSlot.id == booking.time_slot_id).first()
        if time_slot:
            time_slot.is_available = True
        booking.time_slot_id = None
    
    # Handle payout to provider when marking booking as completed
    if status_update.status == "completed":
        # Only attempt payout once, when funds are held in escrow
        if booking.payment_status == "HELD_IN_ESCROW":
            if not stripe:
                raise HTTPException(status_code=503, detail="Stripe payment integration is not available")

            provider = current_provider
            if not provider.stripe_account_id:
                raise HTTPException(
                    status_code=400,
                    detail="Provider payouts are not set up. Please complete Stripe onboarding from the dashboard."
                )

            # Refresh onboarding status from Stripe to avoid stale DB flags
            try:
                account = stripe.Account.retrieve(provider.stripe_account_id)
                provider.stripe_onboarding_complete = bool(
                    getattr(account, "charges_enabled", False) and getattr(account, "payouts_enabled", False)
                )
                db.commit()
                db.refresh(provider)
            except Exception as e:
                print(f"Warning: Failed to refresh Stripe account status for provider {provider.id}: {e}")

            if not provider.stripe_onboarding_complete:
                raise HTTPException(
                    status_code=400,
                    detail="Provider payouts are not yet enabled in Stripe. Please complete onboarding first."
                )

            # Determine payout amount: booking amount minus 10% platform fee
            payment = booking.payment
            if not payment:
                payment = db.query(models.Payment).filter(models.Payment.booking_id == booking.id).first()

            if not payment:
                raise HTTPException(status_code=400, detail="No payment record found for this booking.")

            try:
                gross_amount = float(payment.amount.replace("$", "").replace(",", "").strip())
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid payment amount format: {payment.amount}")

            gross_cents = int(round(gross_amount * 100))
            provider_cents = int(round(gross_cents * 0.95))  # 5% platform fee
            currency = (payment.currency or "usd").lower()

            if not booking.stripe_charge_id:
                # Fallback to payment's charge id if present
                if payment.stripe_charge_id:
                    booking.stripe_charge_id = payment.stripe_charge_id
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Missing Stripe charge ID for payout. Cannot transfer funds to provider."
                    )

            try:
                transfer = stripe.Transfer.create(
                    amount=provider_cents,
                    currency=currency,
                    destination=provider.stripe_account_id,
                    source_transaction=booking.stripe_charge_id,
                    metadata={
                        "booking_id": booking.id,
                        "provider_id": provider.id,
                        "customer_id": booking.customer_id,
                    },
                )

                booking.payment_status = "RELEASED_TO_PROVIDER"
                booking.stripe_transfer_id = transfer.id
            except stripe.error.StripeError as e:
                raise HTTPException(status_code=400, detail=f"Stripe transfer error: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to create payout transfer: {str(e)}")

    db.commit()
    db.refresh(booking)
    
    # Send notifications
    if status_update.status == "accepted" and old_status != "accepted":
        background_tasks.add_task(
            notifications.notify_booking_accepted,
            customer.email,
            customer.full_name or "Customer",
            current_provider.full_name or current_provider.business_name,
            service.name if service else "Service",
            booking_date_local
        )
    elif status_update.status == "confirmed" and old_status != "confirmed":
        # This will be sent when payment is made (in payment confirmation endpoint)
        pass
    elif status_update.status == "rejected":
        background_tasks.add_task(
            notifications.notify_booking_rejected,
            customer.email,
            customer.full_name or "Customer",
            current_provider.full_name or current_provider.business_name,
            service.name if service else "Service",
            booking_date_local
        )
    elif status_update.status == "cancelled":
        background_tasks.add_task(
            notifications.notify_booking_cancelled,
            customer.email,
            customer.full_name or "Customer",
            current_provider.full_name or current_provider.business_name,
            service.name if service else "Service",
            booking_date_local,
            "provider"
        )
    
    return {"message": f"Booking {status_update.status}", "booking_id": booking.id}

@app.put("/provider/services/{service_id}/time-slots")
async def update_service_time_slots(
    service_id: int,
    time_slots: List[TimeSlotCreate],
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Update time slots for a service with overlap validation"""
    service = db.query(models.Service).filter(
        models.Service.id == service_id,
        models.Service.provider_id == current_provider.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Validate time slots (check for overlaps within same day)
    schedule = {}
    for slot in time_slots:
        if not slot.is_available:
            continue
        
        day = slot.day.lower()
        if day not in schedule:
            schedule[day] = []
        
        # Validate time format
        try:
            start = datetime.strptime(slot.start_time, "%H:%M").time()
            end = datetime.strptime(slot.end_time, "%H:%M").time()
            
            if start >= end:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid time slot for {day}: start time must be before end time"
                )
            
            # Check for overlaps with existing slots for the same day
            for existing_slot in schedule[day]:
                existing_start = datetime.strptime(existing_slot["start_time"], "%H:%M").time()
                existing_end = datetime.strptime(existing_slot["end_time"], "%H:%M").time()
                
                # Check if times overlap
                if not (end <= existing_start or start >= existing_end):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Time slot overlap detected for {day}: {slot.start_time}-{slot.end_time} overlaps with {existing_slot['start_time']}-{existing_slot['end_time']}"
                    )
            
            schedule[day].append({
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "is_available": slot.is_available
            })
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid time format for {day}. Use HH:MM format (e.g., 09:00)"
            )
    
    service.availability_schedule = json.dumps(schedule)
    db.commit()
    db.refresh(service)
    return {"message": "Time slots updated", "availability_schedule": service.availability_schedule}

@app.get("/provider/services/{service_id}/time-slots")
async def get_service_time_slots(
    service_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Get time slots for a service (new system - individual slots)"""
    service = db.query(models.Service).filter(
        models.Service.id == service_id,
        models.Service.provider_id == current_provider.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Query time slots
    query = db.query(models.TimeSlot).filter(models.TimeSlot.service_id == service_id)
    
    # Filter by date range if provided
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(models.TimeSlot.slot_date >= start_dt)
        except:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(models.TimeSlot.slot_date <= end_dt)
        except:
            pass
    
    time_slots = query.order_by(models.TimeSlot.slot_date.asc()).all()
    
    return {
        "service_id": service_id,
        "time_slots": [
            {
                "id": slot.id,
                "slot_date": slot.slot_date.isoformat(),
                "is_available": slot.is_available
            }
            for slot in time_slots
        ]
    }

@app.post("/provider/services/{service_id}/time-slots/bulk")
async def create_bulk_time_slots(
    service_id: int,
    request: dict,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Create time slots in bulk for a service (up to 3 months)"""
    service = db.query(models.Service).filter(
        models.Service.id == service_id,
        models.Service.provider_id == current_provider.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Parse request
    start_date_str = request.get("start_date")
    end_date_str = request.get("end_date")
    days_of_week = request.get("days_of_week", [])  # 0=Monday, 6=Sunday
    start_time_str = request.get("start_time")  # HH:MM
    end_time_str = request.get("end_time")  # HH:MM
    interval_minutes = request.get("interval_minutes", 30)
    
    if not all([start_date_str, end_date_str, start_time_str, end_time_str]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Parse dates
    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Validate 3 months limit
    max_date = start_date + timedelta(days=90)
    if end_date > max_date:
        raise HTTPException(status_code=400, detail="Time slots can only be created up to 3 months in advance")
    
    # Parse times
    try:
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
    except:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")
    
    # Get provider timezone
    provider_tz = current_provider.timezone or "UTC"
    
    # Generate time slots
    created_slots = []
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        # Check if this day of week is selected (0=Monday, 6=Sunday)
        day_of_week = current_date.weekday()
        if day_of_week in days_of_week:
            # Create slots for this day
            current_time = start_time
            while current_time < end_time:
                # Create datetime for this slot
                # Build an aware datetime in the provider's timezone.
                # NOTE: `zoneinfo.ZoneInfo` does not support `.localize()` (that's a pytz API).
                # Using replace(tzinfo=...) is sufficient here (Pakistan has no DST edge cases).
                slot_datetime = datetime.combine(current_date, current_time).replace(tzinfo=ZoneInfo(provider_tz))
                
                # Check if slot already exists
                existing = db.query(models.TimeSlot).filter(
                    models.TimeSlot.service_id == service_id,
                    models.TimeSlot.slot_date == slot_datetime
                ).first()
                
                if not existing:
                    new_slot = models.TimeSlot(
                        service_id=service_id,
                        slot_date=slot_datetime,
                        is_available=True
                    )
                    db.add(new_slot)
                    created_slots.append(new_slot)
                
                # Move to next slot
                current_time = (datetime.combine(datetime.min, current_time) + timedelta(minutes=interval_minutes)).time()
        
        current_date += timedelta(days=1)
    
    # Fix sequence before committing to prevent duplicate key errors
    try:
        from sqlalchemy import text
        # Get current max ID and sequence value
        max_id_result = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM time_slots"))
        max_id = max_id_result.scalar() or 0
        
        seq_result = db.execute(text("SELECT last_value FROM time_slots_id_seq"))
        seq_val = seq_result.scalar() or 0
        
        # If sequence is behind or equal to max_id, fix it
        if seq_val <= max_id:
            new_seq_val = max_id + 100  # Set it well ahead to avoid conflicts
            db.execute(text(f"SELECT setval('time_slots_id_seq', {new_seq_val}, false)"))
            db.commit()  # Commit the sequence fix
    except Exception as seq_error:
        # If sequence fix fails, log but continue
        print(f"Warning: Could not fix sequence: {seq_error}")
        db.rollback()
    
    # Now commit the time slots
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        error_str = str(e).lower()
        # Check if it's a duplicate key/sequence issue
        is_sequence_error = (
            "duplicate key" in error_str or 
            "unique constraint" in error_str or 
            "time_slots_pkey" in error_str or
            "uniqueviolation" in error_str
        )
        
        if is_sequence_error:
            try:
                from sqlalchemy import text
                # Fix sequence to be much higher than max to avoid any gaps
                result = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM time_slots"))
                max_id = result.scalar() or 0
                new_seq_val = max_id + 1000  # Set it well ahead to avoid future conflicts
                db.execute(text(f"SELECT setval('time_slots_id_seq', {new_seq_val}, false)"))
                db.commit()
                
                # Re-add all slots and try again
                for slot in created_slots:
                    db.add(slot)
                db.commit()
            except Exception as retry_error:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create time slots after sequence fix. Please try again. Error: {str(retry_error)}"
                )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create time slots: {str(e)}"
            )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create time slots: {str(e)}"
        )
    
    return {
        "message": f"Created {len(created_slots)} time slots",
        "created_count": len(created_slots),
        "service_id": service_id
    }

@app.put("/provider/time-slots/{time_slot_id}")
async def update_time_slot(
    time_slot_id: int,
    request: dict,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Update a time slot (mark as available/unavailable)"""
    time_slot = db.query(models.TimeSlot).join(models.Service).filter(
        models.TimeSlot.id == time_slot_id,
        models.Service.provider_id == current_provider.id
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    if "is_available" in request:
        time_slot.is_available = request.get("is_available")
    
    db.commit()
    db.refresh(time_slot)
    
    return {
        "message": "Time slot updated",
        "time_slot": {
            "id": time_slot.id,
            "slot_date": time_slot.slot_date.isoformat(),
            "is_available": time_slot.is_available
        }
    }

@app.delete("/provider/time-slots/{time_slot_id}")
async def delete_time_slot(
    time_slot_id: int,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Delete a time slot"""
    time_slot = db.query(models.TimeSlot).join(models.Service).filter(
        models.TimeSlot.id == time_slot_id,
        models.Service.provider_id == current_provider.id
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    # Check if slot has a booking
    booking = db.query(models.Booking).filter(models.Booking.time_slot_id == time_slot_id).first()
    if booking:
        raise HTTPException(status_code=400, detail="Cannot delete time slot with existing booking")
    
    db.delete(time_slot)
    db.commit()
    
    return {"message": "Time slot deleted"}

@app.get("/provider/dashboard")
async def get_provider_dashboard(current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Get dashboard data: services, bookings, and portfolio items"""
    from services.provider_level_service import ProviderLevelService
    
    # Check and update stripe onboarding status if pending
    if stripe and current_provider.stripe_account_id and not current_provider.stripe_onboarding_complete:
        try:
            account = stripe.Account.retrieve(current_provider.stripe_account_id)
            is_complete = bool(getattr(account, "charges_enabled", False) and getattr(account, "payouts_enabled", False))
            if is_complete:
                current_provider.stripe_onboarding_complete = True
                db.commit()
                db.refresh(current_provider)
        except Exception as e:
            print(f"Warning: Failed to refresh Stripe onboarding status: {e}")
    
    # Query data
    db_services = db.query(models.Service).filter(models.Service.provider_id == current_provider.id, models.Service.is_active == True).all()
    db_bookings = db.query(models.Booking).filter(models.Booking.provider_id == current_provider.id).order_by(models.Booking.booking_date.desc()).limit(10).all()
    db_portfolio = db.query(models.PortfolioItem).filter(models.PortfolioItem.provider_id == current_provider.id).order_by(models.PortfolioItem.created_at.desc()).limit(6).all()
    
    # Manually serialize services
    services = []
    for s in db_services:
        services.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "description": s.description,
            "price": s.price,
            "duration": s.duration,
            "is_active": s.is_active
        })
        
    # Manually serialize bookings
    bookings = []
    for b in db_bookings:
        customer = db.query(models.Customer).filter(models.Customer.id == b.customer_id).first()
        service = db.query(models.Service).filter(models.Service.id == b.service_id).first()
        bookings.append({
            "id": b.id,
            "service_id": b.service_id,
            "booking_date": b.booking_date.isoformat() if b.booking_date else None,
            "status": b.status,
            "payment_status": getattr(b, "payment_status", "UNPAID"),
            "customer": {
                "full_name": customer.full_name if customer else "Customer",
                "email": customer.email if customer else ""
            },
            "service": {
                "name": service.name if service else "Service",
                "price": service.price if service else "0"
            }
        })
        
    # Manually serialize portfolio items
    portfolio_items = []
    for p in db_portfolio:
        portfolio_items.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "image_url": p.image_url,
            "video_url": p.video_url,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    
    # Get level info
    level_info = ProviderLevelService.get_level_info(current_provider.level or "beginner")
    
    return {
        "provider": {
            "id": current_provider.id,
            "name": current_provider.full_name,
            "business_name": current_provider.business_name,
            "email": current_provider.email,
            "bio": current_provider.bio,
            "city": current_provider.city,
            "phone": current_provider.phone,
            "profile_picture": current_provider.profile_picture,
            "profile_photo": current_provider.profile_photo,
            "level": current_provider.level or "beginner",
            "level_info": level_info,
            "stripe_account_id": getattr(current_provider, "stripe_account_id", None),
            "stripe_onboarding_complete": getattr(current_provider, "stripe_onboarding_complete", False),
        },
        "services": services,
        "bookings": bookings,
        "portfolio_items": portfolio_items,
        "stats": {
            "total_services": len(services),
            "total_bookings": db.query(models.Booking).filter(models.Booking.provider_id == current_provider.id).count(),
            "pending_bookings": db.query(models.Booking).filter(models.Booking.provider_id == current_provider.id, models.Booking.status == "pending").count(),
            "portfolio_items_count": db.query(models.PortfolioItem).filter(models.PortfolioItem.provider_id == current_provider.id).count()
        }
    }

@app.put("/provider/bio")
async def update_provider_bio(request: dict, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Update provider bio"""
    current_provider.bio = request.get("bio", "")
    db.commit()
    db.refresh(current_provider)
    return {"message": "Bio updated", "bio": current_provider.bio}

@app.get("/provider/profile")
async def get_provider_profile(current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Get current provider profile"""
    from services.provider_level_service import ProviderLevelService
    level_info = ProviderLevelService.get_level_info(current_provider.level or "beginner")
    
    return {
        "id": current_provider.id,
        "full_name": current_provider.full_name,
        "email": current_provider.email,
        "phone": current_provider.phone,
        "city": current_provider.city,
        "business_name": current_provider.business_name,
        "bio": current_provider.bio,
        "timezone": current_provider.timezone,
        "profile_picture": current_provider.profile_picture,
        "profile_photo": current_provider.profile_photo,
        "level": current_provider.level or "beginner",
        "level_info": level_info
    }

@app.put("/provider/profile")
async def update_provider_profile(request: dict, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Update provider profile information including timezone"""
    if "full_name" in request:
        current_provider.full_name = request.get("full_name")
    if "phone" in request:
        current_provider.phone = request.get("phone")
    if "city" in request:
        current_provider.city = request.get("city")
    if "business_name" in request:
        current_provider.business_name = request.get("business_name")
    if "timezone" in request:
        # Validate timezone
        try:
            ZoneInfo(request.get("timezone"))
            current_provider.timezone = request.get("timezone")
        except:
            raise HTTPException(status_code=400, detail="Invalid timezone. Use IANA timezone format (e.g., 'America/New_York', 'Asia/Karachi')")
    
    db.commit()
    db.refresh(current_provider)
    return {
        "message": "Profile updated",
        "provider": {
            "id": current_provider.id,
            "full_name": current_provider.full_name,
            "email": current_provider.email,
            "phone": current_provider.phone,
            "city": current_provider.city,
            "business_name": current_provider.business_name,
            "timezone": current_provider.timezone,
        }
    }

@app.put("/provider/profile/photo")
async def update_provider_profile_photo(request: dict, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Update provider profile photo"""
    photo_url = request.get("profile_photo", "")
    current_provider.profile_photo = photo_url
    current_provider.profile_picture = photo_url
    db.commit()
    db.refresh(current_provider)
    return {"message": "Profile photo updated", "profile_photo": current_provider.profile_photo}


@app.post("/provider/stripe/account-link")
async def create_stripe_account_link(
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db),
):
    """
    Create a Stripe AccountLink for provider payouts onboarding.
    Redirect the provider to this URL on the frontend.
    """
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")

    # Ensure provider has a connected account
    if not current_provider.stripe_account_id:
        try:
            connect_country = os.getenv("STRIPE_CONNECT_COUNTRY", "US")
            account = stripe.Account.create(
                type="express",
                country=connect_country,
                email=current_provider.email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_type="individual",
            )
            current_provider.stripe_account_id = account.id
            current_provider.stripe_onboarding_complete = False
            db.commit()
            db.refresh(current_provider)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create Stripe connected account: {str(e)}")

    try:
        refresh_url = os.getenv("STRIPE_ONBOARDING_REFRESH_URL", "http://localhost:3000/dashboard")
        return_url = os.getenv("STRIPE_ONBOARDING_RETURN_URL", "http://localhost:3000/dashboard")

        link = stripe.AccountLink.create(
            account=current_provider.stripe_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        return {"url": link.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error while creating account link: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Stripe account link: {str(e)}")

@app.post("/provider/change-password")
async def change_provider_password(request: dict, current_provider: models.ServiceProvider = Depends(get_current_provider), db: Session = Depends(database.get_db)):
    """Change provider password (no 2FA required)"""
    import re
    
    current_password = request.get("current_password", "")
    new_password = request.get("new_password", "")
    
    # Verify current password
    if not current_provider.hashed_password:
        raise HTTPException(status_code=400, detail="Account has no password set. Please contact support.")
    
    if not auth.verify_password(current_password, current_provider.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    
    # Validate new password
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required.")
    
    password_clean = new_password.strip()
    if not password_clean:
        raise HTTPException(status_code=400, detail="Password cannot be empty or only whitespace.")
    
    if len(password_clean) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    
    # Check for at least one special character
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password_clean):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")
    
    # Hash and update password
    current_provider.hashed_password = auth.get_password_hash(password_clean)
    db.commit()
    
    return {"message": "Password changed successfully"}

# --- Customer Routes (View Providers) ---

@app.get("/providers")
async def get_all_providers(db: Session = Depends(database.get_db)):
    """Get all active service providers (for customers to browse)"""
    from services.provider_level_service import ProviderLevelService
    
    providers = db.query(models.ServiceProvider).filter(models.ServiceProvider.is_active == True).all()
    
    # Add level info to each provider
    result = []
    for provider in providers:
        level_info = ProviderLevelService.get_level_info(provider.level or "beginner")
        provider_dict = {
            "id": provider.id,
            "full_name": provider.full_name,
            "business_name": provider.business_name,
            "email": provider.email,
            "phone": provider.phone,
            "city": provider.city,
            "bio": provider.bio,
            "profile_picture": provider.profile_picture,
            "profile_photo": provider.profile_photo,
            "level": provider.level or "beginner",
            "level_info": level_info
        }
        result.append(provider_dict)
    
    return result

@app.get("/customers")
async def get_all_customers(db: Session = Depends(database.get_db)):
    """Get all customers (for providers to search when creating bookings)"""
    customers = db.query(models.Customer).filter(models.Customer.is_active == True).all()
    return [{"id": c.id, "email": c.email, "full_name": c.full_name, "phone": c.phone} for c in customers]

@app.get("/providers/{provider_id}")
async def get_provider_details(provider_id: int, db: Session = Depends(database.get_db)):
    """Get provider details with portfolio and services (for customers)"""
    provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    portfolio_items = db.query(models.PortfolioItem).filter(models.PortfolioItem.provider_id == provider_id).all()
    services = db.query(models.Service).filter(models.Service.provider_id == provider_id, models.Service.is_active == True).all()
    
    # Get level info
    from services.provider_level_service import ProviderLevelService
    level_info = ProviderLevelService.get_level_info(provider.level or "beginner")
    
    return {
        "provider": {
            "id": provider.id,
            "name": provider.full_name,
            "full_name": provider.full_name,
            "business_name": provider.business_name,
            "email": provider.email,
            "bio": provider.bio,
            "city": provider.city,
            "phone": provider.phone,
            "profile_picture": provider.profile_picture or provider.profile_photo,
            "level": provider.level or "beginner",
            "level_info": level_info
        },
        "portfolio_items": portfolio_items,
        "services": services
    }

# --- Customer Booking Routes ---

def get_current_customer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    """Get current authenticated customer"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "customer":
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    customer = db.query(models.Customer).filter(models.Customer.email == email).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.get("/customer/dashboard")
async def get_customer_dashboard(current_customer: models.Customer = Depends(get_current_customer), db: Session = Depends(database.get_db)):
    """Get dashboard data for customer: bookings, preferences, and stats"""
    import json
    
    # Get customer bookings (recent 10)
    bookings = db.query(models.Booking).filter(
        models.Booking.customer_id == current_customer.id
    ).order_by(models.Booking.created_at.desc()).limit(10).all()
    
    # Format bookings with provider and service details
    formatted_bookings = []
    for booking in bookings:
        provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == booking.provider_id).first()
        service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
        formatted_bookings.append({
            "id": booking.id,
            "service_id": booking.service_id,
            "provider_id": booking.provider_id,
            "booking_date": booking.booking_date.isoformat() if booking.booking_date else None,
            "status": booking.status,
            "notes": booking.notes,
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
            "provider": {
                "id": provider.id if provider else None,
                "full_name": provider.full_name if provider else None,
                "business_name": provider.business_name if provider else None,
            },
            "service": {
                "id": service.id if service else None,
                "name": service.name if service else None,
                "price": service.price if service else None,
            }
        })
    
    # Parse preferences
    categories = []
    if current_customer.categories:
        try:
            categories = json.loads(current_customer.categories)
        except:
            categories = []
    
    # Calculate stats
    total_bookings = db.query(models.Booking).filter(models.Booking.customer_id == current_customer.id).count()
    
    return {
        "customer": {
            "id": current_customer.id,
            "name": current_customer.full_name,
            "email": current_customer.email,
            "phone": current_customer.phone,
            "location": current_customer.location,
            "profile_picture": current_customer.profile_picture,
            "skin_type": current_customer.skin_type,
            "categories": categories,
            "budget_range": current_customer.budget_range
        },
        "bookings": formatted_bookings,
        "stats": {
            "total_bookings": total_bookings
        }
    }

@app.get("/customer/profile")
async def get_customer_profile(current_customer: models.Customer = Depends(get_current_customer), db: Session = Depends(database.get_db)):
    """Get current customer profile"""
    import json
    categories = []
    if current_customer.categories:
        try:
            categories = json.loads(current_customer.categories)
        except:
            categories = []
    
    return {
        "id": current_customer.id,
        "email": current_customer.email,
        "full_name": current_customer.full_name,
        "phone": current_customer.phone,
        "location": current_customer.location,
        "profile_picture": current_customer.profile_picture,
        "is_active": current_customer.is_active,
        "skin_type": current_customer.skin_type,
        "categories": categories,
        "budget_range": current_customer.budget_range
    }

@app.put("/customer/profile")
async def update_customer_profile(request: dict, current_customer: models.Customer = Depends(get_current_customer), db: Session = Depends(database.get_db)):
    """Update customer profile information including preferences"""
    import json
    
    if "full_name" in request:
        current_customer.full_name = request.get("full_name")
    if "phone" in request:
        current_customer.phone = request.get("phone")
    if "location" in request:
        current_customer.location = request.get("location")
    if "skin_type" in request:
        current_customer.skin_type = request.get("skin_type")
    if "categories" in request:
        categories = request.get("categories", [])
        if isinstance(categories, list):
            current_customer.categories = json.dumps(categories)
        else:
            current_customer.categories = None
    if "budget_range" in request:
        current_customer.budget_range = request.get("budget_range")
    
    db.commit()
    db.refresh(current_customer)
    
    # Parse categories for response
    categories = []
    if current_customer.categories:
        try:
            categories = json.loads(current_customer.categories)
        except:
            categories = []
    
    return {
        "message": "Profile updated",
        "customer": {
            "id": current_customer.id,
            "full_name": current_customer.full_name,
            "email": current_customer.email,
            "phone": current_customer.phone,
            "location": current_customer.location,
            "skin_type": current_customer.skin_type,
            "categories": categories,
            "budget_range": current_customer.budget_range
        }
    }

@app.put("/customer/profile/photo")
async def update_customer_profile_photo(request: dict, current_customer: models.Customer = Depends(get_current_customer), db: Session = Depends(database.get_db)):
    """Update customer profile photo"""
    current_customer.profile_picture = request.get("profile_photo", "")
    db.commit()
    db.refresh(current_customer)
    return {"message": "Profile photo updated", "profile_picture": current_customer.profile_picture}

@app.get("/services/{service_id}/available-slots")
async def get_available_time_slots(service_id: int, date: str, db: Session = Depends(database.get_db)):
    """Get available time slots for a service on a specific date (new system)"""
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider for timezone
    provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == service.provider_id).first()
    provider_tz = provider.timezone if provider else "UTC"
    
    # Parse the date
    try:
        target_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        # Get start and end of day in provider timezone
        target_local = booking_utils.convert_to_timezone(target_date, provider_tz)
        start_of_day = target_local.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Convert back to UTC for query
        start_of_day_utc = start_of_day.astimezone(ZoneInfo("UTC"))
        end_of_day_utc = end_of_day.astimezone(ZoneInfo("UTC"))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    # Get available time slots for this date (must be in future and marked available)
    now_utc = datetime.now(ZoneInfo("UTC"))
    
    available_slots = db.query(models.TimeSlot).filter(
        models.TimeSlot.service_id == service_id,
        models.TimeSlot.slot_date >= start_of_day_utc,
        models.TimeSlot.slot_date < end_of_day_utc,
        models.TimeSlot.slot_date > now_utc,
        models.TimeSlot.is_available == True
    ).all()
    
    # Check which slots are already booked
    booked_slot_ids = []
    if available_slots:
        booked_slot_ids = [
            booking.time_slot_id for booking in db.query(models.Booking).filter(
                models.Booking.time_slot_id.in_([slot.id for slot in available_slots]),
                models.Booking.status.in_(["pending", "accepted", "confirmed", "standby_pending", "awaiting_extra_payment", "completed"])
            ).all()
            if booking.time_slot_id
        ]
    
    # Filter out booked slots
    free_slots = [slot for slot in available_slots if slot.id not in booked_slot_ids]
    
    return {
        "service_id": service_id,
        "date": date,
        "timezone": provider_tz,
        "available_slots": [
            {
                "id": slot.id,
                "slot_date": booking_utils.convert_to_timezone(slot.slot_date, provider_tz).isoformat(),
                "time": booking_utils.convert_to_timezone(slot.slot_date, provider_tz).strftime("%H:%M")
            }
            for slot in free_slots
        ],
        "duration": service.duration
    }

@app.post("/bookings")
async def create_booking(
    booking: BookingCreate,
    background_tasks: BackgroundTasks,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db)
):
    """Create a new booking from an available time slot (new system)"""
    # Verify service exists
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider
    provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == service.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Verify time slot exists and is available
    time_slot = db.query(models.TimeSlot).filter(
        models.TimeSlot.id == booking.time_slot_id,
        models.TimeSlot.service_id == booking.service_id,
        models.TimeSlot.is_available == True
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found or not available")
    
    # Check if slot is already booked
    existing_booking = db.query(models.Booking).filter(
        models.Booking.time_slot_id == booking.time_slot_id,
        models.Booking.status.in_(["pending", "accepted", "confirmed", "standby_pending", "awaiting_extra_payment", "completed"])
    ).first()
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="This time slot is already booked")
    
    # Calculate end time from service duration
    booking_date = time_slot.slot_date
    end_date = booking_utils.calculate_end_time(booking_date, service.duration)
    
    # Create booking (status: pending - waiting for provider approval)
    new_booking = models.Booking(
        customer_id=current_customer.id,
        provider_id=service.provider_id,
        service_id=booking.service_id,
        time_slot_id=booking.time_slot_id,
        booking_date=booking_date,
        end_date=end_date,
        status="pending",  # Always starts as pending
        notes=booking.notes,
        # Track original / assigned provider for standby workflows
        original_provider_id=service.provider_id,
        assigned_provider_id=service.provider_id,
        booking_status="pending",
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    # Convert to provider timezone for notification
    provider_tz = provider.timezone or "UTC"
    booking_date_provider_tz = booking_utils.convert_to_timezone(booking_date, provider_tz)
    
    # Send notification in background
    background_tasks.add_task(
        notifications.notify_booking_created,
        current_customer.email,
        current_customer.full_name or "Customer",
        provider.full_name or provider.business_name,
        service.name,
        booking_date_provider_tz,
        new_booking.id
    )
    
    return {
        "id": new_booking.id,
        "message": "Booking created successfully. Waiting for provider approval.",
        "status": new_booking.status,
        "booking_date": booking_date_provider_tz.isoformat()
    }

@app.get("/customer/bookings")
async def get_customer_bookings(current_customer: models.Customer = Depends(get_current_customer), db: Session = Depends(database.get_db)):
    """Get all bookings for the customer"""
    try:
        # Order by created_at descending (most recent first)
        # This is safer than booking_date which might be None
        bookings = db.query(models.Booking).filter(
            models.Booking.customer_id == current_customer.id
        ).order_by(models.Booking.created_at.desc()).all()
        
        result = []
        for booking in bookings:
            try:
                provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == booking.provider_id).first()
                service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
                
                # Convert to provider timezone for display
                provider_tz = provider.timezone if provider else "UTC"
                try:
                    if booking.booking_date:
                        booking_date_local = booking_utils.convert_to_timezone(booking.booking_date, provider_tz)
                        booking_date_local_str = booking_date_local.isoformat()
                    else:
                        booking_date_local_str = None
                except Exception as tz_error:
                    # Fallback if timezone conversion fails
                    print(f"Timezone conversion error for booking {booking.id}: {tz_error}")
                    booking_date_local_str = booking.booking_date.isoformat() if booking.booking_date else None
                
                # ── Payment details (amount paid + refund info) ──────
                payment_record = db.query(models.Payment).filter(
                    models.Payment.booking_id == booking.id
                ).first()

                paid_amount = None
                refunded_amount = None
                if payment_record:
                    paid_amount = payment_record.amount  # string like "40.00"
                    # If a partial refund happened, compute from the original payment
                    if booking.stripe_refund_id and stripe:
                        try:
                            refund_obj = stripe.Refund.retrieve(booking.stripe_refund_id)
                            refunded_amount = str(refund_obj.amount / 100)  # cents → dollars
                        except Exception:
                            pass  # won't block the listing

                result.append({
                    "id": booking.id,
                    "provider": {
                        "id": provider.id if provider else None,
                        "full_name": provider.full_name if provider else None,
                        "business_name": provider.business_name if provider else None,
                    },
                    "service": {
                        "id": service.id if service else None,
                        "name": service.name if service else None,
                        "price": service.price if service else None,
                    },
                    "booking_date": booking.booking_date.isoformat() if booking.booking_date else None,
                    "booking_date_local": booking_date_local_str,
                    "timezone": provider_tz,
                    "status": booking.status,
                    "booking_status": getattr(booking, "booking_status", None),
                    "notes": booking.notes,
                    "created_at": booking.created_at.isoformat() if booking.created_at else None,
                    "payment_status": booking.payment_status if hasattr(booking, 'payment_status') else "UNPAID",
                    "original_provider_id": getattr(booking, "original_provider_id", None),
                    "assigned_provider_id": getattr(booking, "assigned_provider_id", None),
                    "paid_amount": paid_amount,
                    "refunded_amount": refunded_amount,
                })
            except Exception as e:
                # Log error but continue processing other bookings
                import traceback
                print(f"Error processing booking {booking.id}: {e}")
                print(traceback.format_exc())
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_customer_bookings: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@app.put("/customer/bookings/{booking_id}/cancel")
async def cancel_customer_booking(
    booking_id: int,
    background_tasks: BackgroundTasks,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db)
):
    """Cancel a booking (customer can cancel their own bookings)"""
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.customer_id == current_customer.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status in ["cancelled", "completed", "rejected"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel booking with status: {booking.status}")
    
    booking.status = "cancelled"
    
    # Free up the time slot so it becomes available again
    if booking.time_slot_id:
        time_slot = db.query(models.TimeSlot).filter(models.TimeSlot.id == booking.time_slot_id).first()
        if time_slot:
            time_slot.is_available = True
        booking.time_slot_id = None
    
    # Cancel Google Calendar event if exists
    provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == booking.provider_id).first()
    if booking.google_calendar_event_id and provider and provider.google_calendar_access_token:
        service_obj = google_calendar.get_google_calendar_service(
            provider.google_calendar_access_token,
            provider.google_calendar_refresh_token
        )
        if service_obj:
            google_calendar.update_calendar_event(
                service_obj,
                booking.google_calendar_event_id,
                status="cancelled"
            )
    # Handle Stripe Refund if already paid
    if booking.payment_status == "HELD_IN_ESCROW" and booking.stripe_payment_intent_id and stripe:
        try:
            refund = stripe.Refund.create(payment_intent=booking.stripe_payment_intent_id)
            booking.payment_status = "REFUNDED"
            booking.stripe_refund_id = refund.id
            
            payment = db.query(models.Payment).filter(models.Payment.booking_id == booking.id).first()
            if payment:
                payment.status = "refunded"
                payment.refunded_at = datetime.now(ZoneInfo("UTC"))
        except Exception as e:
            print(f"Warning: Failed to process refund during customer cancellation: {e}")

    db.commit()
    db.refresh(booking)
    
    # Note: Standby request will be created only when customer opts-in
    # Don't create automatically - let customer decide
    
    # Send notification
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    provider_tz = provider.timezone if provider else "UTC"
    booking_date_local = booking_utils.convert_to_timezone(booking.booking_date, provider_tz)
    
    background_tasks.add_task(
        notifications.notify_booking_cancelled,
        current_customer.email,
        current_customer.full_name or "Customer",
        provider.full_name or provider.business_name if provider else "Provider",
        service.name if service else "Service",
        booking_date_local,
        "customer"
    )
    
    return {"message": "Booking cancelled successfully", "booking": booking}

# ==================== PAYMENT ENDPOINTS ====================

@app.post("/payments/create-intent")
async def create_payment_intent(
    request: PaymentIntentCreate,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db)
):
    """Create a Stripe Payment Intent for a booking"""
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")
    
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == request.booking_id,
        models.Booking.customer_id == current_customer.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only allow payment for accepted bookings (provider has approved, waiting for payment)
    if booking.status != "accepted":
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot make payment. Booking status must be 'accepted' (current: {booking.status}). Please wait for provider approval."
        )
    
    # Get service to get price
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Parse price (handle ranges like "50-100" or single values like "50")
    price_str = service.price.replace("$", "").replace(",", "").strip()
    if "-" in price_str:
        # Take the first value if it's a range
        price_str = price_str.split("-")[0].strip()
    
    try:
        amount = float(price_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid price format: {service.price}")
    
    # Convert to cents for Stripe
    amount_cents = int(amount * 100)
    
    # Check if payment already exists
    existing_payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking.id
    ).first()
    
    if existing_payment and existing_payment.status == "succeeded":
        raise HTTPException(status_code=400, detail="Payment already completed for this booking")
    
    try:
        # Create Stripe Payment Intent
        # NOTE: No transfer_data here – funds are captured to the platform
        # account and later paid out via a separate transfer (escrow-style).
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={
                "booking_id": booking.id,
                "customer_id": current_customer.id,
                "provider_id": booking.provider_id,
                "service_id": booking.service_id
            }
        )
        
        # Create or update payment record
        if existing_payment:
            existing_payment.stripe_payment_intent_id = intent.id
            existing_payment.amount = str(amount)
            existing_payment.status = "pending"
            payment = existing_payment
        else:
            payment = models.Payment(
                booking_id=booking.id,
                customer_id=current_customer.id,
                provider_id=booking.provider_id,
                amount=str(amount),
                currency="USD",
                stripe_payment_intent_id=intent.id,
                status="pending"
            )
            db.add(payment)
        
        # Link payment + intent to booking (escrow)
        booking.payment_id = payment.id
        booking.stripe_payment_intent_id = intent.id
        
        db.commit()
        db.refresh(payment)
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": amount,
            "currency": "usd",
            "payment_id": payment.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payment intent: {str(e)}")

@app.post("/payments/confirm")
async def confirm_payment(
    request: PaymentConfirm,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db)
):
    """Confirm payment after Stripe payment succeeds"""
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")
    
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == request.booking_id,
        models.Booking.customer_id == current_customer.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get payment
    payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking.id,
        models.Payment.stripe_payment_intent_id == request.payment_intent_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    try:
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(request.payment_intent_id)
        
        if intent.status == "succeeded":
            # Update payment record
            payment.status = "succeeded"
            payment.stripe_charge_id = getattr(intent, "latest_charge", None)
            payment.paid_at = datetime.now(ZoneInfo("UTC"))
            
            # Persist core Stripe IDs on booking for escrow / payouts / refunds
            booking.stripe_payment_intent_id = intent.id
            booking.stripe_charge_id = getattr(intent, "latest_charge", None)

            # Update booking - set status to "confirmed" and payment to held-in-escrow
            booking.status = "confirmed"  # Booking becomes confirmed after payment
            booking.booking_status = "confirmed"
            booking.payment_status = "HELD_IN_ESCROW"
            booking.payment_id = payment.id
            
            # Create Google Calendar event if provider has calendar integration
            provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == booking.provider_id).first()
            if provider and provider.google_calendar_access_token and not booking.google_calendar_event_id:
                service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
                customer = db.query(models.Customer).filter(models.Customer.id == booking.customer_id).first()
                if service and customer:
                    event_id = google_calendar.create_booking_calendar_event(
                        access_token=provider.google_calendar_access_token,
                        refresh_token=provider.google_calendar_refresh_token,
                        customer_name=customer.full_name or "Customer",
                        customer_email=customer.email,
                        provider_name=provider.full_name or provider.business_name,
                        service_name=service.name,
                        booking_date=booking.booking_date,
                        end_date=booking.end_date or booking_utils.calculate_end_time(booking.booking_date, service.duration),
                        notes=booking.notes,
                        location=provider.city
                    )
                    if event_id:
                        booking.google_calendar_event_id = event_id
            
            db.commit()
            db.refresh(payment)
            db.refresh(booking)
            
            return {
                "message": "Payment confirmed successfully",
                "payment_status": booking.payment_status,
                "payment_id": payment.id
            }
        else:
            payment.status = "failed"
            payment.failure_reason = f"Payment intent status: {intent.status}"
            booking.payment_status = "failed"
            db.commit()
            raise HTTPException(status_code=400, detail=f"Payment not succeeded. Status: {intent.status}")
    except stripe.error.StripeError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to confirm payment: {str(e)}")

@app.get("/payments/{payment_id}")
async def get_payment_details(
    payment_id: int,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db)
):
    """Get payment details"""
    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id,
        models.Payment.customer_id == current_customer.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "id": payment.id,
        "booking_id": payment.booking_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "stripe_payment_intent_id": payment.stripe_payment_intent_id,
        "created_at": payment.created_at,
        "paid_at": payment.paid_at
    }

@app.get("/provider/payments")
async def get_provider_payments(
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(database.get_db)
):
    """Get all payment transactions for the provider (transaction history)"""
    payments = db.query(models.Payment).filter(
        models.Payment.provider_id == current_provider.id
    ).order_by(models.Payment.created_at.desc()).all()
    
    result = []
    for payment in payments:
        # Get booking and service details
        booking = db.query(models.Booking).filter(models.Booking.id == payment.booking_id).first()
        service = None
        customer = None
        if booking:
            service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
            customer = db.query(models.Customer).filter(models.Customer.id == payment.customer_id).first()
        
        result.append({
            "id": payment.id,
            "booking_id": payment.booking_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "stripe_payment_intent_id": payment.stripe_payment_intent_id,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
            "refunded_at": payment.refunded_at.isoformat() if payment.refunded_at else None,
            "failure_reason": payment.failure_reason,
            "service": {
                "id": service.id if service else None,
                "name": service.name if service else None,
            } if service else None,
            "customer": {
                "id": customer.id if customer else None,
                "full_name": customer.full_name if customer else None,
                "email": customer.email if customer else None,
            } if customer else None,
        })
    
    return result

@app.get("/customer/payments")
async def get_customer_payments(
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(database.get_db)
):
    """Get all payment transactions for the customer (transaction history)"""
    payments = db.query(models.Payment).filter(
        models.Payment.customer_id == current_customer.id
    ).order_by(models.Payment.created_at.desc()).all()
    
    result = []
    for payment in payments:
        # Get booking and service details
        booking = db.query(models.Booking).filter(models.Booking.id == payment.booking_id).first()
        service = None
        provider = None
        if booking:
            service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
            provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.id == booking.provider_id).first()
        
        result.append({
            "id": payment.id,
            "booking_id": payment.booking_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "stripe_payment_intent_id": payment.stripe_payment_intent_id,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
            "refunded_at": payment.refunded_at.isoformat() if payment.refunded_at else None,
            "failure_reason": payment.failure_reason,
            "service": {
                "id": service.id if service else None,
                "name": service.name if service else None,
            } if service else None,
            "provider": {
                "id": provider.id if provider else None,
                "business_name": provider.business_name if provider else None,
            } if provider else None,
        })
    
    return result

@app.post("/payments/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret:
        # Webhook secret not configured, skip signature verification (not recommended for production)
        print("⚠️ STRIPE_WEBHOOK_SECRET not set, skipping webhook signature verification")
    else:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    # For now, parse JSON directly if no webhook secret
    try:
        import json
        event = json.loads(payload)
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    # Handle the event
    if event.get("type") == "payment_intent.succeeded":
        payment_intent = event.get("data", {}).get("object", {})
        payment_intent_id = payment_intent.get("id")
        
        if payment_intent_id:
            db = next(database.get_db())
            try:
                payment = db.query(models.Payment).filter(
                    models.Payment.stripe_payment_intent_id == payment_intent_id
                ).first()
                
                if payment:
                    payment.status = "succeeded"
                    payment.paid_at = datetime.now(ZoneInfo("UTC"))
                    
                    booking = db.query(models.Booking).filter(models.Booking.id == payment.booking_id).first()
                    if booking:
                        booking.status = "confirmed"  # Set to confirmed when payment succeeds
                        booking.booking_status = "confirmed"
                        booking.payment_status = "HELD_IN_ESCROW"
                        booking.stripe_payment_intent_id = payment_intent_id
                        booking.stripe_charge_id = payment.stripe_charge_id or booking.stripe_charge_id
                    
                    db.commit()
            except Exception as e:
                db.rollback()
                print(f"Error processing webhook: {e}")
            finally:
                db.close()
    
    return {"status": "success"}


# Import RAG routes (optional - gracefully handle if not available)
try:
    from rag.routes import router as rag_router
    app.include_router(rag_router)
    print("✅ RAG recommendation module loaded")
except ImportError as e:
    print(f"⚠️ RAG module not available: {e}")

# Import Rating routes
try:
    from ratings.routes import router as ratings_router
    app.include_router(ratings_router)
    print("✅ Rating system module loaded")
except ImportError as e:
    print(f"⚠️ Rating module not available: {e}")

# Fallback list of major Pakistan cities (in case API fails)
PAKISTAN_CITIES_FALLBACK = [
    "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Hyderabad", "Gujranwala",
    "Peshawar", "Quetta", "Islamabad", "Bahawalpur", "Sargodha", "Sialkot", "Sukkur",
    "Larkana", "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat",
    "Sahiwal", "Wah Cantonment", "Mardan", "Kasur", "Okara", "Mingora", "Nawabshah",
    "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat", "Jacobabad", "Shikarpur",
    "Muzaffargarh", "Khanpur", "Gojra", "Bahawalnagar", "Abbottabad", "Muridke",
    "Pakpattan", "Khuzdar", "Jhelum", "Chaman", "Kot Abdul Malik", "Dadu", "Mandi Bahauddin",
    "Ahmadpur East", "Kamalia", "Tando Adam", "Khairpur", "Dera Ismail Khan", "Vehari",
    "Nowshera", "Daska", "Burewala", "Shahkot", "Mianwali", "Kabirwala", "Chishtian",
    "Hasilpur", "Attock", "Muzaffarabad", "Mian Channun", "Bhalwal", "Jaranwala",
    "Chakwal", "Gujar Khan", "Khanewal"
]

@app.post("/pakistan-cities")
async def get_pakistan_cities():
    """
    Fetch list of cities in Pakistan from external API
    Returns list of city names
    Falls back to hardcoded list if API fails
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://countriesnow.space/api/v0.1/countries/cities",
                json={"country": "Pakistan"},
                follow_redirects=True
            )
            response.raise_for_status()
            data = response.json()
            
            # Check if API returned success with data
            if data.get("error") == False and "data" in data and isinstance(data["data"], list):
                cities = data["data"]
                # Remove duplicates and sort alphabetically
                cities = sorted(list(set(cities)))
                return {"cities": cities, "count": len(cities)}
            elif data.get("error") == True:
                # API returned an error message, use fallback
                error_msg = data.get("msg", "Unknown error")
                print(f"Cities API error: {error_msg}, using fallback list")
                return {"cities": sorted(PAKISTAN_CITIES_FALLBACK), "count": len(PAKISTAN_CITIES_FALLBACK), "fallback": True}
            else:
                # Unexpected format, use fallback
                print(f"Unexpected API response format, using fallback list")
                return {"cities": sorted(PAKISTAN_CITIES_FALLBACK), "count": len(PAKISTAN_CITIES_FALLBACK), "fallback": True}
    except httpx.TimeoutException as e:
        print(f"Timeout error: {e}, using fallback list")
        return {"cities": sorted(PAKISTAN_CITIES_FALLBACK), "count": len(PAKISTAN_CITIES_FALLBACK), "fallback": True}
    except httpx.HTTPStatusError as e:
        error_detail = f"Cities API returned error: {e.response.status_code}"
        try:
            error_body = e.response.json()
            error_detail = error_body.get("msg", error_body.get("error", error_detail))
        except:
            pass
        print(f"HTTP error: {error_detail}, using fallback list")
        return {"cities": sorted(PAKISTAN_CITIES_FALLBACK), "count": len(PAKISTAN_CITIES_FALLBACK), "fallback": True}
    except httpx.RequestError as e:
        print(f"Request error: {e}, using fallback list")
        return {"cities": sorted(PAKISTAN_CITIES_FALLBACK), "count": len(PAKISTAN_CITIES_FALLBACK), "fallback": True}
    except Exception as e:
        import traceback
        print(f"Unexpected error: {e}, using fallback list")
        print(traceback.format_exc())
        return {"cities": sorted(PAKISTAN_CITIES_FALLBACK), "count": len(PAKISTAN_CITIES_FALLBACK), "fallback": True}

@app.get("/")
async def read_root():
    return {"message": "GlowSense AI Backend (Multi-Role) is Running!"}

import subprocess
@app.post("/api/ar/launch")
async def launch_ar_studio():
    """Launch the local AR Virtual Makeup Studio Tkinter app."""
    try:
        subprocess.Popen(["python", "ar_makeup.py"], cwd=".")
        return {"status": "success", "message": "AR Studio launched"}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
