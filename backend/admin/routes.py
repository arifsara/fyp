"""
Admin API Routes
Handles admin authentication and admin-only endpoints (e.g. viewing all ratings/feedback)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import get_db
from models import Rating, Booking, Customer, ServiceProvider, Service
import auth

router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()

# =====================================================
# Admin credentials (loaded from .env)
# =====================================================
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@glowsense.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123!")


# =====================================================
# Pydantic Models
# =====================================================

class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminRatingItem(BaseModel):
    id: int
    booking_id: int
    rating: int
    comment: Optional[str]
    created_at: str
    # Customer details
    customer_id: int
    customer_name: Optional[str]
    customer_email: Optional[str]
    # Provider details
    provider_id: int
    provider_name: Optional[str]
    provider_email: Optional[str]
    provider_business: Optional[str]
    # Service details
    service_id: int
    service_name: Optional[str]


class AdminRatingsOverview(BaseModel):
    total_ratings: int
    average_rating: float
    total_providers: int
    total_customers: int
    ratings: List[AdminRatingItem]


# =====================================================
# Auth helpers
# =====================================================

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify that the caller has a valid admin JWT token."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        role: str = payload.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    return payload


# =====================================================
# Admin Endpoints
# =====================================================

@router.post("/login")
async def admin_login(body: AdminLoginRequest):
    """
    Authenticate admin with email + password defined in environment variables.
    Returns a JWT with role='admin'.
    """
    if body.email != ADMIN_EMAIL or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = auth.create_access_token(data={"sub": body.email, "role": "admin"})
    return {"access_token": token, "token_type": "bearer", "role": "admin"}


@router.get("/ratings/all", response_model=AdminRatingsOverview)
async def get_all_ratings(
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Return every rating in the system together with customer, provider, and service
    details so the admin can see all feedback at a glance.
    """
    ratings = (
        db.query(Rating)
        .order_by(Rating.created_at.desc())
        .all()
    )

    # Aggregate stats
    stats = db.query(
        func.count(Rating.id).label("total"),
        func.avg(Rating.rating).label("avg"),
    ).first()

    total_providers = db.query(func.count(ServiceProvider.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0

    items: list[AdminRatingItem] = []
    for r in ratings:
        customer = db.query(Customer).filter(Customer.id == r.customer_id).first()
        provider = db.query(ServiceProvider).filter(ServiceProvider.id == r.provider_id).first()
        service = db.query(Service).filter(Service.id == r.service_id).first()

        items.append(
            AdminRatingItem(
                id=r.id,
                booking_id=r.booking_id,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at.isoformat(),
                customer_id=r.customer_id,
                customer_name=customer.full_name if customer else None,
                customer_email=customer.email if customer else None,
                provider_id=r.provider_id,
                provider_name=provider.full_name if provider else None,
                provider_email=provider.email if provider else None,
                provider_business=provider.business_name if provider else None,
                service_id=r.service_id,
                service_name=service.name if service else None,
            )
        )

    return AdminRatingsOverview(
        total_ratings=stats.total or 0,
        average_rating=round(float(stats.avg or 0), 2),
        total_providers=total_providers,
        total_customers=total_customers,
        ratings=items,
    )


@router.get("/ratings/provider/{provider_id}")
async def get_provider_ratings_admin(
    provider_id: int,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all ratings for a specific provider (admin view)."""
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    ratings = (
        db.query(Rating)
        .filter(Rating.provider_id == provider_id)
        .order_by(Rating.created_at.desc())
        .all()
    )

    stats = db.query(
        func.avg(Rating.rating).label("avg"),
        func.count(Rating.id).label("total"),
    ).filter(Rating.provider_id == provider_id).first()

    items = []
    for r in ratings:
        customer = db.query(Customer).filter(Customer.id == r.customer_id).first()
        service = db.query(Service).filter(Service.id == r.service_id).first()
        items.append({
            "id": r.id,
            "booking_id": r.booking_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
            "customer_name": customer.full_name if customer else None,
            "customer_email": customer.email if customer else None,
            "service_name": service.name if service else None,
        })

    return {
        "provider_id": provider_id,
        "provider_name": provider.full_name,
        "provider_email": provider.email,
        "business_name": provider.business_name,
        "average_rating": round(float(stats.avg or 0), 2),
        "total_ratings": stats.total or 0,
        "ratings": items,
    }
