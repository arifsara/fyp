"""
Standby Support Service
Manages the automated standby queue system
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from zoneinfo import ZoneInfo
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import ServiceProvider, Service, Booking, TimeSlot, Customer
from models import StandbyQueue, StandbyNotification, StandbyRequest
from booking_utils import check_provider_availability


class StandbyService:
    """Service for managing standby queue and matching"""
    
    STANDBY_EXPIRY_DAYS = 5  # Standby entries expire after 5 days
    NOTIFICATION_SHOW_DAYS = 5  # Show notifications for 5 days
    
    def __init__(self, db: Session):
        self.db = db
    
    def add_provider_to_standby(
        self,
        provider_id: int,
        slot_date: datetime,
        service_id: Optional[int] = None,
        slot_start_time: Optional[datetime.time] = None,
        slot_end_time: Optional[datetime.time] = None
    ) -> StandbyQueue:
        """
        Add a provider's free slot to the standby queue
        
        Args:
            provider_id: ID of the provider
            slot_date: Date/time of the free slot
            service_id: Optional service ID
            slot_start_time: Optional start time
            slot_end_time: Optional end time
            
        Returns:
            Created StandbyQueue entry
        """
        # Check if provider exists
        provider = self.db.query(ServiceProvider).filter(
            ServiceProvider.id == provider_id
        ).first()
        
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")
        
        # Calculate expiry (5 days from now)
        expires_at = datetime.now(ZoneInfo("UTC")) + timedelta(days=self.STANDBY_EXPIRY_DAYS)
        
        # Create standby queue entry
        standby_entry = StandbyQueue(
            provider_id=provider_id,
            service_id=service_id,
            slot_date=slot_date,
            slot_start_time=slot_start_time,
            slot_end_time=slot_end_time,
            expires_at=expires_at,
            is_active=True,
            notified_provider=False
        )
        
        self.db.add(standby_entry)
        self.db.commit()
        self.db.refresh(standby_entry)
        
        # Create notification for provider
        self._create_provider_notification(provider_id, standby_entry.id, slot_date)
        
        return standby_entry
    
    def _create_provider_notification(
        self,
        provider_id: int,
        standby_queue_id: int,
        slot_date: datetime
    ):
        """Create a notification for provider about being added to standby"""
        shown_until = datetime.now(ZoneInfo("UTC")) + timedelta(days=self.NOTIFICATION_SHOW_DAYS)
        
        message = f"You have been added to the Standby List for {slot_date.strftime('%B %d, %Y at %I:%M %p')}. You may receive last-minute booking requests."
        
        notification = StandbyNotification(
            provider_id=provider_id,
            standby_queue_id=standby_queue_id,
            message=message,
            days_shown=self.NOTIFICATION_SHOW_DAYS,
            shown_until=shown_until,
            is_read=False
        )
        
        self.db.add(notification)
        self.db.commit()
    
    def get_provider_standby_notifications(
        self,
        provider_id: int
    ) -> List[StandbyNotification]:
        """
        Get active standby notifications for a provider
        
        Args:
            provider_id: ID of the provider
            
        Returns:
            List of active notifications
        """
        now = datetime.now(ZoneInfo("UTC"))
        
        notifications = self.db.query(StandbyNotification).filter(
            and_(
                StandbyNotification.provider_id == provider_id,
                StandbyNotification.shown_until > now,
                StandbyNotification.is_read == False
            )
        ).order_by(StandbyNotification.created_at.desc()).all()
        
        return notifications
    
    def mark_notification_read(self, notification_id: int, provider_id: int):
        """Mark a notification as read"""
        notification = self.db.query(StandbyNotification).filter(
            and_(
                StandbyNotification.id == notification_id,
                StandbyNotification.provider_id == provider_id
            )
        ).first()
        
        if notification:
            notification.is_read = True
            self.db.commit()
    
    def find_standby_providers(
        self,
        original_booking_date: datetime,
        service_id: int,
        customer_id: int,
        original_provider_city: str = None
    ) -> List[Dict]:
        """
        Find available standby providers for a cancelled booking
        Filters by: same category AND same city
        
        Args:
            original_booking_date: Original booking date/time
            service_id: Service ID that was booked
            customer_id: Customer ID
            original_provider_city: City of the original provider (for filtering)
            
        Returns:
            List of available providers with their details
        """
        now = datetime.now(ZoneInfo("UTC"))
        
        # Get service details first to get category and original provider city
        service = self.db.query(Service).filter(Service.id == service_id).first()
        if not service:
            return []
        
        # Get original provider to get city if not provided
        if not original_provider_city:
            original_booking = self.db.query(Booking).filter(
                Booking.service_id == service_id
            ).order_by(Booking.created_at.desc()).first()
            
            if original_booking:
                original_provider = self.db.query(ServiceProvider).filter(
                    ServiceProvider.id == original_booking.provider_id
                ).first()
                if original_provider:
                    original_provider_city = original_provider.city
        
        # Find active standby entries that match the time slot
        # Look for providers with free slots around the same time (within 2 hours)
        time_window_start = original_booking_date - timedelta(hours=2)
        time_window_end = original_booking_date + timedelta(hours=2)
        
        standby_entries = self.db.query(StandbyQueue).filter(
            and_(
                StandbyQueue.is_active == True,
                StandbyQueue.expires_at > now,
                StandbyQueue.slot_date >= time_window_start,
                StandbyQueue.slot_date <= time_window_end,
                or_(
                    StandbyQueue.service_id == service_id,
                    StandbyQueue.service_id == None  # General availability
                )
            )
        ).all()
        
        # Filter providers by availability, category, and city
        available_providers = []
        for entry in standby_entries:
            provider = self.db.query(ServiceProvider).filter(
                ServiceProvider.id == entry.provider_id
            ).first()
            
            if not provider or not provider.is_active:
                continue
            
            # FILTER BY CITY: Must be in the same city as original provider
            if original_provider_city and provider.city != original_provider_city:
                continue
            
            # Check if provider actually has the service
            provider_services = self.db.query(Service).filter(
                and_(
                    Service.provider_id == provider.id,
                    Service.is_active == True
                )
            ).all()
            
            # FILTER BY CATEGORY: Must have service in same category
            has_same_category = any(
                s.category == service.category and s.category is not None 
                for s in provider_services
            )
            
            if not has_same_category:
                continue
            
            # Check actual availability
            slot_start = entry.slot_date
            slot_end = slot_start + timedelta(minutes=int(service.duration) if service.duration else 60)
            
            if check_provider_availability(
                self.db,
                provider.id,
                slot_start,
                slot_end
            ):
                # Get provider rating
                from services.provider_level_service import ProviderLevelService
                avg_rating = ProviderLevelService.get_provider_average_rating(provider.id, self.db)
                level_info = ProviderLevelService.get_level_info(provider.level or "beginner")
                
                available_providers.append({
                    "provider_id": provider.id,
                    "provider_name": provider.full_name,
                    "business_name": provider.business_name,
                    "city": provider.city,
                    "profile_picture": provider.profile_picture or provider.profile_photo,
                    "level": provider.level or "beginner",
                    "level_info": level_info,
                    "average_rating": avg_rating,
                    "standby_queue_id": entry.id,
                    "available_slot_date": entry.slot_date.isoformat(),
                    "slot_start_time": entry.slot_start_time.isoformat() if entry.slot_start_time else None,
                    "slot_end_time": entry.slot_end_time.isoformat() if entry.slot_end_time else None,
                    "services": [{"id": s.id, "name": s.name, "price": s.price, "category": s.category} for s in provider_services]
                })
        
        return available_providers
    
    def create_standby_request(
        self,
        customer_id: int,
        cancelled_booking_id: int,
        original_booking_date: datetime,
        original_service_id: int
    ) -> StandbyRequest:
        """
        Create a standby request when a booking is cancelled
        
        Args:
            customer_id: ID of the customer
            cancelled_booking_id: ID of the cancelled booking
            original_booking_date: Original booking date
            original_service_id: Original service ID
            
        Returns:
            Created StandbyRequest
        """
        standby_request = StandbyRequest(
            customer_id=customer_id,
            cancelled_booking_id=cancelled_booking_id,
            original_booking_date=original_booking_date,
            original_service_id=original_service_id,
            status="pending"
        )
        
        self.db.add(standby_request)
        self.db.commit()
        self.db.refresh(standby_request)
        
        return standby_request
    
    def match_standby_provider(
        self,
        standby_request_id: int,
        provider_id: int,
        standby_queue_id: int
    ) -> bool:
        """
        Match a standby provider to a request
        
        Args:
            standby_request_id: ID of the standby request
            provider_id: ID of the provider to match
            standby_queue_id: ID of the standby queue entry
            
        Returns:
            True if matched successfully
        """
        standby_request = self.db.query(StandbyRequest).filter(
            StandbyRequest.id == standby_request_id
        ).first()
        
        if not standby_request or standby_request.status != "pending":
            return False
        
        # Update request
        standby_request.matched_provider_id = provider_id
        standby_request.matched_at = datetime.now(ZoneInfo("UTC"))
        standby_request.status = "matched"
        
        # Deactivate standby queue entry
        standby_entry = self.db.query(StandbyQueue).filter(
            StandbyQueue.id == standby_queue_id
        ).first()
        
        if standby_entry:
            standby_entry.is_active = False
        
        self.db.commit()
        return True
    
    def cleanup_expired_standby(self):
        """Clean up expired standby entries"""
        now = datetime.now(ZoneInfo("UTC"))
        
        # Deactivate expired entries
        expired = self.db.query(StandbyQueue).filter(
            and_(
                StandbyQueue.is_active == True,
                StandbyQueue.expires_at <= now
            )
        ).all()
        
        for entry in expired:
            entry.is_active = False
        
        self.db.commit()
        
        return len(expired)

