"""
Booking utility functions for overlap detection, timezone handling, and validation
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
import models


def is_overlapping(
    start1: datetime,
    end1: datetime,
    start2: datetime,
    end2: datetime
) -> bool:
    """
    Check if two time ranges overlap.
    
    Args:
        start1: Start time of first range
        end1: End time of first range
        start2: Start time of second range
        end2: End time of second range
    
    Returns:
        True if ranges overlap, False otherwise
    """
    # Ensure all datetimes are timezone-aware
    if start1.tzinfo is None:
        start1 = start1.replace(tzinfo=ZoneInfo("UTC"))
    if end1.tzinfo is None:
        end1 = end1.replace(tzinfo=ZoneInfo("UTC"))
    if start2.tzinfo is None:
        start2 = start2.replace(tzinfo=ZoneInfo("UTC"))
    if end2.tzinfo is None:
        end2 = end2.replace(tzinfo=ZoneInfo("UTC"))
    
    # Check for overlap: ranges overlap if start1 < end2 and start2 < end1
    return start1 < end2 and start2 < end1


def parse_duration(duration_str: str) -> int:
    """
    Parse duration string (e.g., "60 minutes", "1 hour", "90 min") to minutes.
    
    Args:
        duration_str: Duration string
    
    Returns:
        Duration in minutes
    """
    duration_str = duration_str.lower().strip()
    
    # Extract numbers
    import re
    numbers = re.findall(r'\d+', duration_str)
    if not numbers:
        return 60  # Default to 60 minutes
    
    minutes = int(numbers[0])
    
    # Check for hours
    if 'hour' in duration_str:
        minutes = minutes * 60
    
    return minutes


def calculate_end_time(start_time: datetime, duration_str: str) -> datetime:
    """
    Calculate end time from start time and duration.
    
    Args:
        start_time: Booking start time
        duration_str: Service duration string
    
    Returns:
        End time
    """
    minutes = parse_duration(duration_str)
    return start_time + timedelta(minutes=minutes)


def convert_to_timezone(dt: datetime, timezone_str: str) -> datetime:
    """
    Convert datetime to specified timezone.
    
    Args:
        dt: Datetime to convert
        timezone_str: Target timezone (e.g., "America/New_York")
    
    Returns:
        Datetime in target timezone
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    
    target_tz = ZoneInfo(timezone_str)
    return dt.astimezone(target_tz)


def check_provider_availability(
    db: Session,
    provider_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[int] = None
) -> bool:
    """
    Check if provider is available during the given time range.
    
    Args:
        db: Database session
        provider_id: Provider ID
        start_time: Booking start time
        end_time: Booking end time
        exclude_booking_id: Booking ID to exclude from check (for updates)
    
    Returns:
        True if available, False if conflicts exist
    """
    # Get all confirmed/pending bookings for this provider
    query = db.query(models.Booking).filter(
        models.Booking.provider_id == provider_id,
        models.Booking.status.in_(["pending", "confirmed"]),
        models.Booking.booking_date < end_time
    )
    
    if exclude_booking_id:
        query = query.filter(models.Booking.id != exclude_booking_id)
    
    existing_bookings = query.all()
    
    # Check for overlaps
    for booking in existing_bookings:
        booking_end = booking.end_date or calculate_end_time(
            booking.booking_date,
            booking.service.duration if booking.service else "60 minutes"
        )
        
        if is_overlapping(start_time, end_time, booking.booking_date, booking_end):
            return False
    
    return True


def check_service_time_slot_availability(
    db: Session,
    service_id: int,
    booking_date: datetime,
    provider_timezone: str = "UTC"
) -> bool:
    """
    Check if a time slot is available based on service availability schedule.
    
    Args:
        db: Database session
        service_id: Service ID
        booking_date: Desired booking date/time
        provider_timezone: Provider's timezone
    
    Returns:
        True if slot is available according to schedule
    """
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service or not service.availability_schedule:
        return False
    
    # Convert booking date to provider's timezone
    booking_local = convert_to_timezone(booking_date, provider_timezone)
    
    # Get day of week
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    day_name = day_names[booking_local.weekday()].lower()
    
    # Check schedule for this day
    schedule = service.availability_schedule
    day_schedule = schedule.get(day_name, [])
    
    if not day_schedule:
        return False
    
    booking_time = booking_local.time()
    
    # Check if booking time falls within any available slot
    for slot in day_schedule:
        if not slot.get("is_available", True):
            continue
        
        try:
            start_time = datetime.strptime(slot["start_time"], "%H:%M").time()
            end_time = datetime.strptime(slot["end_time"], "%H:%M").time()
            
            if start_time <= booking_time < end_time:
                return True
        except (ValueError, KeyError):
            continue
    
    return False


def get_available_slots_for_date(
    db: Session,
    service_id: int,
    target_date: datetime,
    provider_timezone: str = "UTC",
    slot_interval: int = 30
) -> List[str]:
    """
    Get all available time slots for a specific date.
    
    Args:
        db: Database session
        service_id: Service ID
        target_date: Target date (datetime)
        provider_timezone: Provider's timezone
        slot_interval: Interval between slots in minutes (default: 30)
    
    Returns:
        List of available time slots as strings (HH:MM format)
    """
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        return []
    
    # Convert to provider timezone
    target_local = convert_to_timezone(target_date, provider_timezone)
    
    # Get day of week
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    day_name = day_names[target_local.weekday()].lower()
    
    # Get schedule for this day
    schedule = service.availability_schedule or {}
    day_schedule = schedule.get(day_name, [])
    
    if not day_schedule:
        return []
    
    # Get existing bookings for this date
    start_of_day = target_local.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Convert back to UTC for database query
    start_of_day_utc = start_of_day.astimezone(ZoneInfo("UTC"))
    end_of_day_utc = end_of_day.astimezone(ZoneInfo("UTC"))
    
    existing_bookings = db.query(models.Booking).filter(
        models.Booking.service_id == service_id,
        models.Booking.booking_date >= start_of_day_utc,
        models.Booking.booking_date < end_of_day_utc,
        models.Booking.status.in_(["pending", "confirmed"])
    ).all()
    
    # Extract booked times (in provider timezone)
    booked_times = []
    for booking in existing_bookings:
        booking_local = convert_to_timezone(booking.booking_date, provider_timezone)
        booked_times.append(booking_local.strftime("%H:%M"))
    
    # Generate available slots
    available_slots = []
    
    for slot in day_schedule:
        if not slot.get("is_available", True):
            continue
        
        try:
            start_time = datetime.strptime(slot["start_time"], "%H:%M").time()
            end_time = datetime.strptime(slot["end_time"], "%H:%M").time()
            
            # Generate slots in the interval
            current = datetime.combine(target_local.date(), start_time)
            end = datetime.combine(target_local.date(), end_time)
            
            while current < end:
                slot_time = current.strftime("%H:%M")
                
                # Check if this slot is booked
                if slot_time not in booked_times:
                    # Also check if slot + service duration would overlap with next booking
                    slot_datetime = datetime.combine(target_local.date(), current.time())
                    slot_datetime = slot_datetime.replace(tzinfo=ZoneInfo(provider_timezone))
                    slot_end = calculate_end_time(slot_datetime, service.duration)
                    
                    # Check if this slot conflicts with any existing booking
                    conflicts = False
                    for booking in existing_bookings:
                        booking_local_dt = convert_to_timezone(booking.booking_date, provider_timezone)
                        booking_end = booking.end_date or calculate_end_time(
                            booking.booking_date,
                            booking.service.duration if booking.service else "60 minutes"
                        )
                        booking_end_local = convert_to_timezone(booking_end, provider_timezone)
                        
                        if is_overlapping(slot_datetime, slot_end, booking_local_dt, booking_end_local):
                            conflicts = True
                            break
                    
                    if not conflicts:
                        available_slots.append(slot_time)
                
                current += timedelta(minutes=slot_interval)
        except (ValueError, KeyError):
            continue
    
    return sorted(available_slots)

