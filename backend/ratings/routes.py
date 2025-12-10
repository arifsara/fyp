"""
Rating System API Routes
Separate module for rating functionality
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import get_db
from models import Rating, Booking, Customer, ServiceProvider, Service
import auth

security = HTTPBearer()

def get_current_customer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
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
    
    customer = db.query(Customer).filter(Customer.email == email).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

def get_current_provider(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current authenticated provider"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "provider":
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    provider = db.query(ServiceProvider).filter(ServiceProvider.email == email).first()
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

router = APIRouter(prefix="/ratings", tags=["Ratings"])


# =====================================================
# Pydantic Models
# =====================================================

class RatingCreate(BaseModel):
    booking_id: int
    rating: int  # 1-5
    comment: Optional[str] = None


class RatingResponse(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    provider_id: int
    service_id: int
    rating: int
    comment: Optional[str]
    created_at: str
    customer_name: Optional[str] = None
    service_name: Optional[str] = None


class ProviderRatingStats(BaseModel):
    provider_id: int
    average_rating: float
    total_ratings: int
    ratings: List[RatingResponse]


class ServiceRatingStats(BaseModel):
    service_id: int
    average_rating: float
    total_ratings: int


# =====================================================
# Customer Endpoints
# =====================================================

@router.post("/create", response_model=RatingResponse)
async def create_rating(
    rating_data: RatingCreate,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Customer creates a rating for a completed booking
    """
    # Verify booking exists and belongs to customer
    booking = db.query(Booking).filter(
        Booking.id == rating_data.booking_id,
        Booking.customer_id == current_customer.id,
        Booking.status == "completed"
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found or not completed. Only completed bookings can be rated."
        )
    
    # Check if rating already exists
    existing_rating = db.query(Rating).filter(
        Rating.booking_id == rating_data.booking_id
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=400,
            detail="This booking has already been rated."
        )
    
    # Validate rating value
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )
    
    # Create rating
    rating = Rating(
        booking_id=rating_data.booking_id,
        customer_id=current_customer.id,
        provider_id=booking.provider_id,
        service_id=booking.service_id,
        rating=rating_data.rating,
        comment=rating_data.comment
    )
    
    db.add(rating)
    db.commit()
    db.refresh(rating)
    
    # Update provider level based on new rating
    if ProviderLevelService:
        try:
            ProviderLevelService.update_provider_level(booking.provider_id, db)
        except Exception as e:
            print(f"Warning: Failed to update provider level: {e}")
            # Don't fail the rating creation if level update fails
    
    # Get service name for response
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    
    return RatingResponse(
        id=rating.id,
        booking_id=rating.booking_id,
        customer_id=rating.customer_id,
        provider_id=rating.provider_id,
        service_id=rating.service_id,
        rating=rating.rating,
        comment=rating.comment,
        created_at=rating.created_at.isoformat(),
        customer_name=current_customer.full_name,
        service_name=service.name if service else None
    )


@router.get("/provider/{provider_id}/average")
async def get_provider_average_rating(
    provider_id: int,
    db: Session = Depends(get_db)
):
    """
    Get average rating for a provider (public endpoint)
    """
    result = db.query(
        func.avg(Rating.rating).label('average'),
        func.count(Rating.id).label('count')
    ).filter(
        Rating.provider_id == provider_id
    ).first()
    
    return {
        "provider_id": provider_id,
        "average_rating": round(float(result.average or 0), 2),
        "total_ratings": result.count or 0
    }


@router.get("/provider/{provider_id}/all")
async def get_provider_all_ratings(
    provider_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all ratings for a provider (public endpoint for customers to view)
    """
    ratings = db.query(Rating).filter(
        Rating.provider_id == provider_id
    ).order_by(Rating.created_at.desc()).all()
    
    # Calculate average
    avg_result = db.query(
        func.avg(Rating.rating).label('average'),
        func.count(Rating.id).label('count')
    ).filter(
        Rating.provider_id == provider_id
    ).first()
    
    # Format ratings with customer and service info
    rating_list = []
    for rating in ratings:
        customer = db.query(Customer).filter(Customer.id == rating.customer_id).first()
        service = db.query(Service).filter(Service.id == rating.service_id).first()
        
        rating_list.append({
            "id": rating.id,
            "booking_id": rating.booking_id,
            "customer_id": rating.customer_id,
            "provider_id": rating.provider_id,
            "service_id": rating.service_id,
            "rating": rating.rating,
            "comment": rating.comment,
            "created_at": rating.created_at.isoformat(),
            "customer_name": customer.full_name if customer else None,
            "service_name": service.name if service else None
        })
    
    return {
        "provider_id": provider_id,
        "average_rating": round(float(avg_result.average or 0), 2),
        "total_ratings": avg_result.count or 0,
        "ratings": rating_list
    }


@router.get("/service/{service_id}/average")
async def get_service_average_rating(
    service_id: int,
    db: Session = Depends(get_db)
):
    """
    Get average rating for a specific service
    """
    result = db.query(
        func.avg(Rating.rating).label('average'),
        func.count(Rating.id).label('count')
    ).filter(
        Rating.service_id == service_id
    ).first()
    
    return {
        "service_id": service_id,
        "average_rating": round(float(result.average or 0), 2),
        "total_ratings": result.count or 0
    }


@router.get("/customer/my-ratings", response_model=List[RatingResponse])
async def get_customer_ratings(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get all ratings given by the current customer
    """
    ratings = db.query(Rating).filter(
        Rating.customer_id == current_customer.id
    ).order_by(Rating.created_at.desc()).all()
    
    result = []
    for rating in ratings:
        service = db.query(Service).filter(Service.id == rating.service_id).first()
        result.append(RatingResponse(
            id=rating.id,
            booking_id=rating.booking_id,
            customer_id=rating.customer_id,
            provider_id=rating.provider_id,
            service_id=rating.service_id,
            rating=rating.rating,
            comment=rating.comment,
            created_at=rating.created_at.isoformat(),
            customer_name=current_customer.full_name,
            service_name=service.name if service else None
        ))
    
    return result


# =====================================================
# Provider Endpoints
# =====================================================

@router.get("/provider/my-ratings", response_model=ProviderRatingStats)
async def get_provider_ratings(
    current_provider: ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db)
):
    """
    Get all ratings received by the current provider
    """
    ratings = db.query(Rating).filter(
        Rating.provider_id == current_provider.id
    ).order_by(Rating.created_at.desc()).all()
    
    # Calculate average
    avg_result = db.query(
        func.avg(Rating.rating).label('average'),
        func.count(Rating.id).label('count')
    ).filter(
        Rating.provider_id == current_provider.id
    ).first()
    
    # Format ratings with customer and service info
    rating_list = []
    for rating in ratings:
        customer = db.query(Customer).filter(Customer.id == rating.customer_id).first()
        service = db.query(Service).filter(Service.id == rating.service_id).first()
        
        rating_list.append(RatingResponse(
            id=rating.id,
            booking_id=rating.booking_id,
            customer_id=rating.customer_id,
            provider_id=rating.provider_id,
            service_id=rating.service_id,
            rating=rating.rating,
            comment=rating.comment,
            created_at=rating.created_at.isoformat(),
            customer_name=customer.full_name if customer else None,
            service_name=service.name if service else None
        ))
    
    return ProviderRatingStats(
        provider_id=current_provider.id,
        average_rating=round(float(avg_result.average or 0), 2),
        total_ratings=avg_result.count or 0,
        ratings=rating_list
    )


@router.get("/booking/{booking_id}/check")
async def check_booking_rating(
    booking_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Check if a booking has been rated (for customer)
    """
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.customer_id == current_customer.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    rating = db.query(Rating).filter(
        Rating.booking_id == booking_id
    ).first()
    
    return {
        "booking_id": booking_id,
        "is_rated": rating is not None,
        "can_rate": booking.status == "completed" and rating is None,
        "rating": {
            "id": rating.id,
            "rating": rating.rating,
            "comment": rating.comment,
            "created_at": rating.created_at.isoformat()
        } if rating else None
    }

