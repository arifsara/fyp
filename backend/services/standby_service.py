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
        customer_location: str = None
    ) -> List[Dict]:
        """
        Find available standby providers for a cancelled booking
        Filters by: same day (any time), same category, AND same location as customer
        
        Args:
            original_booking_date: Original booking date/time
            service_id: Service ID that was booked
            customer_id: Customer ID
            customer_location: Customer's location/city (for filtering)
            
        Returns:
            List of available providers with their details
        """
        now = datetime.now(ZoneInfo("UTC"))
        
        # Get service details first to get category
        service = self.db.query(Service).filter(Service.id == service_id).first()
        if not service:
            return []
        
        # Get customer to get location if not provided
        if not customer_location:
            customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
            if customer:
                customer_location = customer.location
        
        if not customer_location:
            # If customer has no location, return empty list
            return []
        
        # Extract the date from original booking (same day, any time)
        # Get start and end of the day for the original booking date
        original_date = original_booking_date.date()
        day_start = datetime.combine(original_date, datetime.min.time()).replace(tzinfo=ZoneInfo("UTC"))
        day_end = day_start + timedelta(days=1)
        
        # Find active standby entries that match the same day
        # Look for providers with free slots on the same day (any time)
        standby_entries = self.db.query(StandbyQueue).filter(
            and_(
                StandbyQueue.is_active == True,
                StandbyQueue.expires_at > now,
                StandbyQueue.slot_date >= day_start,
                StandbyQueue.slot_date < day_end,
                or_(
                    StandbyQueue.service_id == service_id,
                    StandbyQueue.service_id == None  # General availability
                )
            )
        ).all()
        
        # Also find providers with available TimeSlots on the same day
        # This includes providers who have created time slots but haven't added to standby queue
        available_time_slots = self.db.query(TimeSlot).join(Service).filter(
            and_(
                TimeSlot.is_available == True,
                TimeSlot.slot_date >= day_start,
                TimeSlot.slot_date < day_end,
                Service.category == service.category,
                Service.is_active == True
            )
        ).all()
        
        # Debug logging
        print(f"[Standby Debug] Date range: {day_start} to {day_end}")
        print(f"[Standby Debug] Standby entries found: {len(standby_entries)}")
        print(f"[Standby Debug] Time slots found: {len(available_time_slots)}")
        print(f"[Standby Debug] Customer location: {customer_location}, Service category: {service.category}")
        
        # Get unique provider IDs from time slots
        provider_ids_from_slots = set()
        time_slots_by_provider = {}
        for slot in available_time_slots:
            provider_id = slot.service.provider_id
            provider_ids_from_slots.add(provider_id)
            if provider_id not in time_slots_by_provider:
                time_slots_by_provider[provider_id] = []
            time_slots_by_provider[provider_id].append(slot)
        
        # Filter providers by availability, category, and customer location
        available_providers = []
        processed_provider_ids = set()
        
        # Process standby queue entries first
        for entry in standby_entries:
            provider = self.db.query(ServiceProvider).filter(
                ServiceProvider.id == entry.provider_id
            ).first()
            
            if not provider or not provider.is_active:
                continue
            
            # FILTER BY LOCATION: Must be in the same location as customer
            if customer_location and provider.city != customer_location:
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
                processed_provider_ids.add(provider.id)
        
        # Now process providers from available TimeSlots (who may not be in standby queue)
        for provider_id in provider_ids_from_slots:
            if provider_id in processed_provider_ids:
                continue  # Already processed from standby queue
                
            provider = self.db.query(ServiceProvider).filter(
                ServiceProvider.id == provider_id,
                ServiceProvider.is_active == True
            ).first()
            
            if not provider:
                continue
            
            # FILTER BY LOCATION: Must be in the same location as customer
            if customer_location and provider.city != customer_location:
                continue
            
            # Get provider services
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
            
            # Get available time slots for this provider on this day
            provider_slots = time_slots_by_provider.get(provider_id, [])
            if not provider_slots:
                continue
            
            # Check if any slot is actually available (not booked)
            available_slot = None
            for slot in provider_slots:
                # Check if slot is not booked
                existing_booking = self.db.query(Booking).filter(
                    Booking.time_slot_id == slot.id,
                    Booking.status.in_(["pending", "confirmed"])
                ).first()
                
                if not existing_booking:
                    available_slot = slot
                    break
            
            if not available_slot:
                continue
            
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
                "standby_queue_id": None,  # Not from standby queue
                "time_slot_id": available_slot.id,  # Use time slot ID instead
                "available_slot_date": available_slot.slot_date.isoformat(),
                "slot_start_time": None,
                "slot_end_time": None,
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

