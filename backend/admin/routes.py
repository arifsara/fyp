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
import json
from datetime import datetime, timezone

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import get_db
from models import Rating, Booking, Customer, ServiceProvider, Service, Payment
import auth

router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()

# =====================================================
# Admin credentials (loaded from .env)
# =====================================================
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "adminglowsense@gmail.com")
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


class AdminBookingItem(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str]
    customer_email: Optional[str]
    provider_id: int
    provider_name: Optional[str]
    provider_business: Optional[str]
    provider_email: Optional[str]
    service_id: int
    service_name: Optional[str]
    service_price: Optional[str]
    time_slot_id: Optional[int]
    slot_date: Optional[str]
    booking_date: str
    status: str
    booking_status: Optional[str]
    payment_status: str
    original_time_slot: Optional[str] = None  # Specific for cancelled_by_provider
    created_at: str


class AdminStandbyItem(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    original_provider_id: Optional[int]
    original_provider_name: str
    original_provider_business: Optional[str]
    assigned_provider_id: Optional[int]
    assigned_provider_name: Optional[str]
    service_id: int
    service_name: str
    service_price: str
    booking_date: str
    status: str
    booking_status: Optional[str]
    payment_status: str
    days_since_cancellation: int
    created_at: str


class AdminAssignProviderRequest(BaseModel):
    provider_id: int


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


@router.get("/providers")
async def get_all_providers(
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Fetch all service providers in the system."""
    providers = db.query(ServiceProvider).all()
    result = []
    for p in providers:
        # Get count of bookings and ratings
        bookings_count = db.query(func.count(Booking.id)).filter(Booking.provider_id == p.id).scalar() or 0
        ratings_count = db.query(func.count(Rating.id)).filter(Rating.provider_id == p.id).scalar() or 0
        avg_rating = db.query(func.avg(Rating.rating)).filter(Rating.provider_id == p.id).scalar() or 0
        
        result.append({
            "id": p.id,
            "full_name": p.full_name,
            "business_name": p.business_name,
            "email": p.email,
            "phone": p.phone,
            "city": p.city,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat(),
            "level": p.level,
            "bookings_count": bookings_count,
            "ratings_count": ratings_count,
            "average_rating": round(float(avg_rating), 2)
        })
    return result


@router.get("/customers")
async def get_all_customers(
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Fetch all customers in the system."""
    customers = db.query(Customer).all()
    result = []
    for c in customers:
        bookings_count = db.query(func.count(Booking.id)).filter(Booking.customer_id == c.id).scalar() or 0
        result.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "city": c.location,
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat(),
            "bookings_count": bookings_count
        })
    return result


@router.get("/customer/{customer_id}")
async def get_customer_details_admin(
    customer_id: int,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Fetch profile details for a specific customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # Count their total bookings
    bookings_count = db.query(Booking).filter(Booking.customer_id == customer_id).count()
        
    return {
        "id": customer.id,
        "full_name": customer.full_name,
        "email": customer.email,
        "phone": customer.phone,
        "city": customer.location,
        "bookings_count": bookings_count,
        "created_at": customer.created_at.isoformat() if customer.created_at else None
    }


@router.delete("/provider/{provider_id}")
async def delete_provider(
    provider_id: int,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remove a service provider and their associated data."""
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Cascade delete-orphan should handle services, bookings, portfolio_items in SQLAlchemy
    # But for manual FK constraints on Rating and Payment, we should clean them up if they don't cascade
    try:
        # Delete ratings first (they reference provider and booking)
        db.query(Rating).filter(Rating.provider_id == provider_id).delete(synchronize_session=False)
        
        # Delete payments associated with this provider
        db.query(Payment).filter(Payment.provider_id == provider_id).delete(synchronize_session=False)
        
        # Finally delete provider (SQLAlchemy handles cascade for services/bookings/portfolio)
        db.delete(provider)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error deleting provider: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting provider: {str(e)}")
        
    return {"message": "Provider and all associated data deleted successfully"}


@router.get("/bookings", response_model=List[AdminBookingItem])
async def get_all_bookings_admin(
    status: Optional[str] = None,
    search: Optional[str] = None,
    customer_id: Optional[int] = None,
    provider_id: Optional[int] = None,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Fetch all bookings in the system with full details.
    Supports filtering by status, customer_id, provider_id and searching by name/business.
    """
    from sqlalchemy import or_
    from models import TimeSlot
    
    query = db.query(Booking)
    
    # Filter by customer_id if provided
    if customer_id:
        query = query.filter(Booking.customer_id == customer_id)
        
    # Filter by provider_id if provided
    if provider_id:
        query = query.filter(Booking.provider_id == provider_id)
    
    # Filter by status (we check both status and booking_status)
    if status:
        query = query.filter(or_(Booking.status == status, Booking.booking_status == status))
        
    # Search functionality
    if search:
        search_filter = or_(
            Customer.full_name.ilike(f"%{search}%"),
            ServiceProvider.full_name.ilike(f"%{search}%"),
            ServiceProvider.business_name.ilike(f"%{search}%"),
            Service.name.ilike(f"%{search}%")
        )
        query = query.join(Customer).join(ServiceProvider).join(Service).filter(search_filter)

    bookings = query.order_by(Booking.created_at.desc()).all()
    
    result = []
    for b in bookings:
        # Fetch related objects manually if not joined
        customer = db.query(Customer).filter(Customer.id == b.customer_id).first()
        provider = db.query(ServiceProvider).filter(ServiceProvider.id == b.provider_id).first()
        service = db.query(Service).filter(Service.id == b.service_id).first()
        time_slot = None
        if b.time_slot_id:
            time_slot = db.query(TimeSlot).filter(TimeSlot.id == b.time_slot_id).first()
            
        # For cancelled_by_provider, we explicitly return the original time slot
        # In our system, time_slot.slot_date identifies the original intended time
        original_time_slot = None
        if b.status == "cancelled_by_provider" or b.booking_status == "cancelled_by_provider":
            if time_slot:
                original_time_slot = time_slot.slot_date.isoformat()
            else:
                original_time_slot = b.booking_date.isoformat()

        result.append(
            AdminBookingItem(
                id=b.id,
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else "N/A",
                customer_email=customer.email if customer else "N/A",
                provider_id=b.provider_id,
                provider_name=provider.full_name if provider else "N/A",
                provider_business=provider.business_name if provider else "N/A",
                provider_email=provider.email if provider else "N/A",
                service_id=b.service_id,
                service_name=service.name if service else "N/A",
                service_price=service.price if service else "N/A",
                time_slot_id=b.time_slot_id,
                slot_date=time_slot.slot_date.isoformat() if time_slot else None,
                booking_date=b.booking_date.isoformat(),
                status=b.status,
                booking_status=b.booking_status,
                payment_status=b.payment_status or "UNPAID",
                original_time_slot=original_time_slot,
                created_at=b.created_at.isoformat()
            )
        )
        
    return result


# ────────────────────────────────────────────────
# Standby Management Endpoints
# ────────────────────────────────────────────────

@router.get("/standby/active", response_model=List[AdminStandbyItem])
async def get_active_standby_requests(
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Fetch all bookings currently in a 'standby' or 'cancelled by provider' state.
    """
    from sqlalchemy import or_
    
    standby_statuses = ["cancelled_by_provider", "standby_pending", "standby_selected", "awaiting_extra_payment"]
    
    bookings = db.query(Booking).filter(
        or_(
            Booking.status.in_(standby_statuses),
            Booking.booking_status.in_(standby_statuses)
        )
    ).order_by(Booking.created_at.desc()).all()
    
    result = []
    now = datetime.now(timezone.utc)
    
    for b in bookings:
        customer = db.query(Customer).filter(Customer.id == b.customer_id).first()
        # Original provider is either stored in original_provider_id or it's the current provider_id if not yet reassigned
        orig_id = b.original_provider_id or b.provider_id
        original_provider = db.query(ServiceProvider).filter(ServiceProvider.id == orig_id).first()
        
        assigned_provider = None
        if b.assigned_provider_id:
            assigned_provider = db.query(ServiceProvider).filter(ServiceProvider.id == b.assigned_provider_id).first()
            
        service = db.query(Service).filter(Service.id == b.service_id).first()
        
        # Calculate days since cancellation
        days_since = 0
        if b.status == "cancelled_by_provider" or b.booking_status == "cancelled_by_provider":
            # For simplicity, we'll use created_at as a proxy or assume cancellation happened recently
            # Ideally we'd have a 'cancelled_at' field, but we'll use (now - created_at) as an upper bound
            delta = now - b.created_at.replace(tzinfo=timezone.utc)
            days_since = delta.days

        result.append(
            AdminStandbyItem(
                id=b.id,
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else "N/A",
                customer_email=customer.email if customer else "N/A",
                original_provider_id=orig_id,
                original_provider_name=original_provider.full_name if original_provider else "N/A",
                original_provider_business=original_provider.business_name if original_provider else None,
                assigned_provider_id=b.assigned_provider_id,
                assigned_provider_name=assigned_provider.full_name if assigned_provider else None,
                service_id=b.service_id,
                service_name=service.name if service else "N/A",
                service_price=service.price if service else "N/A",
                booking_date=b.booking_date.isoformat(),
                status=b.status,
                booking_status=b.booking_status,
                payment_status=b.payment_status,
                days_since_cancellation=days_since,
                created_at=b.created_at.isoformat()
            )
        )
        
    return result


@router.get("/standby/suggested-providers/{booking_id}")
async def get_suggested_providers(
    booking_id: int,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Find providers in the same city and category as the original service.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    service = db.query(Service).filter(Service.id == b.service_id).first() if 'service' in locals() else db.query(Service).filter(Service.id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    orig_provider = db.query(ServiceProvider).filter(ServiceProvider.id == (booking.original_provider_id or booking.provider_id)).first()
    city = orig_provider.city if orig_provider else None
    category = service.category
    
    # Simple matching for now: same city and have a service in the same category
    from sqlalchemy import and_
    
    query = db.query(ServiceProvider).join(Service).filter(
        and_(
            ServiceProvider.is_active == True,
            ServiceProvider.id != orig_provider.id if orig_provider else True,
            ServiceProvider.city == city if city else True,
            Service.category == category if category else True
        )
    ).distinct()
    
    suggested = query.all()
    
    result = []
    for p in suggested:
        # Find their specific service in this category
        p_service = db.query(Service).filter(
            Service.provider_id == p.id,
            Service.category == category
        ).first()
        
        result.append({
            "id": p.id,
            "full_name": p.full_name,
            "business_name": p.business_name,
            "city": p.city,
            "level": p.level,
            "price": p_service.price if p_service else "N/A",
            "service_id": p_service.id if p_service else None
        })
        
    return result


@router.post("/standby/{booking_id}/assign")
async def admin_assign_standby_provider(
    booking_id: int,
    body: AdminAssignProviderRequest,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin manually assigns a provider to a standby booking.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    new_provider = db.query(ServiceProvider).filter(ServiceProvider.id == body.provider_id).first()
    if not new_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    # Update booking
    if not booking.original_provider_id:
        booking.original_provider_id = booking.provider_id
        
    booking.provider_id = new_provider.id
    booking.assigned_provider_id = new_provider.id
    booking.status = "standby_pending"
    booking.booking_status = "standby_pending"
    
    # Notify customer and provider (admin-initiated)
    from models import Notification
    from models import Service
    
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    
    # Notification for Customer
    cust_notif = Notification(
        customer_id=booking.customer_id,
        booking_id=booking.id,
        type="standby_selected",
        title="Replacement Provider Assigned by Admin",
        message=f"An administrator has assigned {new_provider.full_name} as your replacement provider for '{service.name}'. The provider has been notified.",
        data=json.dumps({"booking_id": booking.id, "admin_assigned": True})
    )
    db.add(cust_notif)
    
    # Notification for Provider
    prov_notif = Notification(
        provider_id=new_provider.id,
        booking_id=booking.id,
        type="standby_selected",
        title="Admin-Assigned Standby Request",
        message=f"You have been assigned as a replacement provider for a '{service.name}' booking by an administrator. Please accept or reject this from your dashboard.",
        data=json.dumps({"booking_id": booking.id, "admin_assigned": True})
    )
    db.add(prov_notif)
    
    db.commit()
    return {"message": "Provider assigned successfully", "booking_id": booking.id}


@router.post("/standby/{booking_id}/refund")
async def admin_trigger_standby_refund(
    booking_id: int,
    _admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin manually triggers a refund for a standby booking.
    """
    from models import RefundRequest, Notification
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.payment_status != "HELD_IN_ESCROW":
        raise HTTPException(status_code=400, detail="Only bookings with funds in escrow can be refunded.")
        
    # Logic to trigger Stripe refund (mirroring standby_refund logic)
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    
    if not booking.stripe_payment_intent_id:
        raise HTTPException(status_code=400, detail="No stripe payment intent found")
        
    try:
        refund = stripe.Refund.create(payment_intent=booking.stripe_payment_intent_id)
        
        booking.status = "refunded"
        booking.booking_status = "refunded"
        booking.payment_status = "REFUNDED"
        booking.stripe_refund_id = refund.id
        
        # Update payment record
        from models import Payment
        payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
        if payment:
            payment.status = "refunded"
            payment.refunded_at = datetime.now(timezone.utc)
            
        # Notify Customer
        notif = Notification(
            customer_id=booking.customer_id,
            booking_id=booking.id,
            type="refund_processed",
            title="Refund Processed by Admin",
            message="An administrator has processed your refund for the cancelled booking. The funds should appear in your account in 5-10 business days.",
            data=json.dumps({"booking_id": booking.id, "refund_id": refund.id})
        )
        db.add(notif)
        db.commit()
        
        return {"message": "Refund processed successfully", "refund_id": refund.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Refund failed: {str(e)}")
