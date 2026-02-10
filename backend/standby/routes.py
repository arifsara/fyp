"""
Standby Support System API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import ServiceProvider, Customer, StandbyQueue, StandbyNotification, StandbyRequest
from services.standby_service import StandbyService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import auth

security = HTTPBearer()
router = APIRouter(prefix="/standby", tags=["Standby Support"])


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


# Request/Response Models
class StandbySlotAdd(BaseModel):
    slot_date: str  # ISO format datetime
    service_id: Optional[int] = None
    slot_start_time: Optional[str] = None  # HH:MM format
    slot_end_time: Optional[str] = None  # HH:MM format


class StandbyProviderMatch(BaseModel):
    standby_request_id: int
    provider_id: int
    standby_queue_id: int


# Provider Endpoints
@router.get("/provider/notifications")
async def get_provider_notifications(
    current_provider: ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db)
):
    """Get active standby notifications for provider"""
    standby_service = StandbyService(db)
    notifications = standby_service.get_provider_standby_notifications(current_provider.id)
    
    return {
        "notifications": [
            {
                "id": n.id,
                "message": n.message,
                "created_at": n.created_at.isoformat(),
                "shown_until": n.shown_until.isoformat(),
                "is_read": n.is_read
            }
            for n in notifications
        ]
    }


@router.post("/provider/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_provider: ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    standby_service = StandbyService(db)
    standby_service.mark_notification_read(notification_id, current_provider.id)
    return {"message": "Notification marked as read"}


@router.post("/provider/add-slot")
async def add_provider_slot(
    slot_data: StandbySlotAdd,
    current_provider: ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db)
):
    """Add provider's free slot to standby queue"""
    try:
        slot_date = datetime.fromisoformat(slot_data.slot_date.replace('Z', '+00:00'))
        slot_start = None
        slot_end = None
        
        if slot_data.slot_start_time:
            slot_start = datetime.strptime(slot_data.slot_start_time, "%H:%M").time()
        if slot_data.slot_end_time:
            slot_end = datetime.strptime(slot_data.slot_end_time, "%H:%M").time()
        
        standby_service = StandbyService(db)
        entry = standby_service.add_provider_to_standby(
            current_provider.id,
            slot_date,
            slot_data.service_id,
            slot_start,
            slot_end
        )
        
        return {
            "message": "Slot added to standby queue",
            "standby_queue_id": entry.id,
            "expires_at": entry.expires_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Customer Endpoints
@router.get("/customer/pending-request")
async def get_pending_standby_request(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Check if customer has a cancelled booking that can use standby support"""
    from models import Booking
    
    # Find recently cancelled bookings (within last 24 hours) that don't have a standby request yet
    now = datetime.now(ZoneInfo("UTC"))
    yesterday = now - timedelta(hours=24)
    
    cancelled_bookings = db.query(Booking).filter(
        Booking.customer_id == current_customer.id,
        Booking.status == "cancelled",
        Booking.created_at >= yesterday
    ).order_by(Booking.created_at.desc()).all()
    
    # Check if any cancelled booking doesn't have a standby request
    for booking in cancelled_bookings:
        existing_request = db.query(StandbyRequest).filter(
            StandbyRequest.cancelled_booking_id == booking.id,
            StandbyRequest.customer_id == current_customer.id
        ).first()
        
        if not existing_request:
            # Found a cancelled booking without standby request
            return {
                "has_pending_request": True,
                "cancelled_booking_id": booking.id,
                "original_booking_date": booking.booking_date.isoformat(),
                "service_id": booking.service_id,
                "needs_opt_in": True  # Customer needs to opt-in
            }
    
    # Check for existing pending standby requests
    standby_request = db.query(StandbyRequest).filter(
        StandbyRequest.customer_id == current_customer.id,
        StandbyRequest.status == "pending"
    ).order_by(StandbyRequest.created_at.desc()).first()
    
    if standby_request:
        return {
            "has_pending_request": True,
            "standby_request_id": standby_request.id,
            "cancelled_booking_id": standby_request.cancelled_booking_id,
            "original_booking_date": standby_request.original_booking_date.isoformat(),
            "service_id": standby_request.original_service_id,
            "created_at": standby_request.created_at.isoformat(),
            "needs_opt_in": False
        }
    
    return {"has_pending_request": False}


@router.get("/customer/available-providers")
async def get_available_standby_providers(
    cancelled_booking_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get available standby providers for a cancelled booking
    Filters by: same day (any time), same category, AND same location as customer"""
    from models import Booking
    
    # Get cancelled booking
    booking = db.query(Booking).filter(
        Booking.id == cancelled_booking_id,
        Booking.customer_id == current_customer.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "cancelled":
        raise HTTPException(status_code=400, detail="Booking is not cancelled")
    
    # Get customer location
    customer_location = current_customer.location
    
    standby_service = StandbyService(db)
    providers = standby_service.find_standby_providers(
        booking.booking_date,
        booking.service_id,
        current_customer.id,
        customer_location
    )
    
    return {
        "cancelled_booking_id": cancelled_booking_id,
        "original_booking_date": booking.booking_date.isoformat(),
        "customer_location": customer_location,
        "available_providers": providers
    }


class StandbyOptIn(BaseModel):
    cancelled_booking_id: int

@router.post("/customer/opt-in")
async def opt_in_to_standby(
    opt_in_data: StandbyOptIn,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Customer opts-in to standby support for a cancelled booking"""
    from models import Booking
    
    # Verify booking exists and belongs to customer
    booking = db.query(Booking).filter(
        Booking.id == opt_in_data.cancelled_booking_id,
        Booking.customer_id == current_customer.id,
        Booking.status == "cancelled"
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Cancelled booking not found")
    
    # Check if standby request already exists
    existing_request = db.query(StandbyRequest).filter(
        StandbyRequest.cancelled_booking_id == opt_in_data.cancelled_booking_id,
        StandbyRequest.customer_id == current_customer.id
    ).first()
    
    if existing_request:
        return {
            "message": "Standby request already exists",
            "standby_request_id": existing_request.id,
            "cancelled_booking_id": opt_in_data.cancelled_booking_id
        }
    
    # Create standby request
    standby_service = StandbyService(db)
    standby_request = standby_service.create_standby_request(
        current_customer.id,
        booking.id,
        booking.booking_date,
        booking.service_id
    )
    
    return {
        "message": "Opted-in to standby support",
        "standby_request_id": standby_request.id,
        "cancelled_booking_id": opt_in_data.cancelled_booking_id
    }


@router.post("/customer/match-provider")
async def match_standby_provider(
    match_data: StandbyProviderMatch,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Match a standby provider to customer's request"""
    # Verify request belongs to customer
    standby_request = db.query(StandbyRequest).filter(
        StandbyRequest.id == match_data.standby_request_id,
        StandbyRequest.customer_id == current_customer.id
    ).first()
    
    if not standby_request:
        raise HTTPException(status_code=404, detail="Standby request not found")
    
    standby_service = StandbyService(db)
    success = standby_service.match_standby_provider(
        match_data.standby_request_id,
        match_data.provider_id,
        match_data.standby_queue_id
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to match provider")
    
    return {
        "message": "Provider matched successfully",
        "standby_request_id": match_data.standby_request_id,
        "provider_id": match_data.provider_id
    }


class StandbyBookingCreate(BaseModel):
    cancelled_booking_id: int
    provider_id: int
    service_id: int
    standby_queue_id: Optional[int] = None  # Optional if from standby queue
    time_slot_id: Optional[int] = None  # Optional if from time slot
    notes: Optional[str] = None


@router.post("/customer/create-booking")
async def create_standby_booking(
    booking_data: StandbyBookingCreate,
    background_tasks: BackgroundTasks,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a booking from standby provider selection"""
    from models import Booking, Service, ServiceProvider, TimeSlot
    import booking_utils
    import notifications
    
    # Verify cancelled booking exists and belongs to customer
    cancelled_booking = db.query(Booking).filter(
        Booking.id == booking_data.cancelled_booking_id,
        Booking.customer_id == current_customer.id,
        Booking.status == "cancelled"
    ).first()
    
    if not cancelled_booking:
        raise HTTPException(status_code=404, detail="Cancelled booking not found")
    
    # Verify service exists and belongs to provider
    service = db.query(Service).filter(
        Service.id == booking_data.service_id,
        Service.provider_id == booking_data.provider_id,
        Service.is_active == True
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Verify provider exists
    provider = db.query(ServiceProvider).filter(
        ServiceProvider.id == booking_data.provider_id,
        ServiceProvider.is_active == True
    ).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get booking date from either standby queue entry or time slot
    booking_date = None
    standby_entry = None
    time_slot = None
    
    if booking_data.standby_queue_id:
        # Provider from standby queue
        standby_entry = db.query(StandbyQueue).filter(
            StandbyQueue.id == booking_data.standby_queue_id,
            StandbyQueue.provider_id == booking_data.provider_id,
            StandbyQueue.is_active == True
        ).first()
        
        if not standby_entry:
            raise HTTPException(status_code=404, detail="Standby slot not found or no longer available")
        
        booking_date = standby_entry.slot_date
    elif booking_data.time_slot_id:
        # Provider from time slot
        time_slot = db.query(TimeSlot).filter(
            TimeSlot.id == booking_data.time_slot_id,
            TimeSlot.service_id == booking_data.service_id,
            TimeSlot.is_available == True
        ).first()
        
        if not time_slot:
            raise HTTPException(status_code=404, detail="Time slot not found or no longer available")
        
        # Check if slot is already booked
        existing_booking = db.query(Booking).filter(
            Booking.time_slot_id == booking_data.time_slot_id,
            Booking.status.in_(["pending", "confirmed"])
        ).first()
        
        if existing_booking:
            raise HTTPException(status_code=400, detail="This time slot is already booked")
        
        booking_date = time_slot.slot_date
    else:
        raise HTTPException(status_code=400, detail="Either standby_queue_id or time_slot_id must be provided")
    
    # Check if provider is available at this time
    end_date = booking_utils.calculate_end_time(booking_date, service.duration)
    if not booking_utils.check_provider_availability(db, provider.id, booking_date, end_date):
        raise HTTPException(status_code=400, detail="Provider is no longer available at this time slot")
    
    # If we don't have a time slot yet (from standby queue), create or find one
    if not time_slot:
        time_slot = db.query(TimeSlot).filter(
            TimeSlot.service_id == service.id,
            TimeSlot.slot_date == booking_date,
            TimeSlot.is_available == True
        ).first()
        
        if not time_slot:
            # Create a new time slot
            time_slot = TimeSlot(
                service_id=service.id,
                slot_date=booking_date,
                is_available=False  # Mark as unavailable since we're booking it
            )
            db.add(time_slot)
            db.flush()
    
    # Create the booking
    new_booking = Booking(
        customer_id=current_customer.id,
        provider_id=provider.id,
        service_id=service.id,
        time_slot_id=time_slot.id,
        booking_date=booking_date,
        end_date=end_date,
        status="pending",
        notes=booking_data.notes or f"Booked via standby support (replacing cancelled booking #{cancelled_booking.id})"
    )
    db.add(new_booking)
    
    # Mark standby queue entry as inactive if it exists
    if standby_entry:
        standby_entry.is_active = False
    
    # Mark time slot as unavailable
    time_slot.is_available = False
    
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
        "message": "Booking created successfully from standby support. Waiting for provider approval.",
        "status": new_booking.status,
        "booking_date": booking_date_provider_tz.isoformat()
    }

