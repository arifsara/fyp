"""
Standby Support System API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import ServiceProvider, Customer
from standby_models import StandbyQueue, StandbyNotification, StandbyRequest
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
@router.get("/customer/available-providers")
async def get_available_standby_providers(
    cancelled_booking_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get available standby providers for a cancelled booking"""
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
    
    standby_service = StandbyService(db)
    providers = standby_service.find_standby_providers(
        booking.booking_date,
        booking.service_id,
        current_customer.id
    )
    
    return {
        "cancelled_booking_id": cancelled_booking_id,
        "original_booking_date": booking.booking_date.isoformat(),
        "available_providers": providers
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

