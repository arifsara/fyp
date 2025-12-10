"""
Google Calendar API integration for booking management
"""
import os
import logging
from typing import Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

# Optional Google Calendar imports (gracefully handle if not installed)
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_CALENDAR_AVAILABLE = True
except ImportError:
    GOOGLE_CALENDAR_AVAILABLE = False
    logger.warning("Google Calendar API libraries not installed. Calendar integration disabled.")

# Google Calendar API scopes
SCOPES = ['https://www.googleapis.com/auth/calendar']

# OAuth 2.0 client configuration (set via environment variables)
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")


def get_google_calendar_service(access_token: str, refresh_token: Optional[str] = None) -> Optional[object]:
    """
    Get Google Calendar service instance.
    
    Args:
        access_token: Google OAuth access token
        refresh_token: Google OAuth refresh token (optional)
    
    Returns:
        Google Calendar service object or None
    """
    if not GOOGLE_CALENDAR_AVAILABLE:
        logger.warning("Google Calendar API not available")
        return None
    
    try:
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET
        )
        
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        logger.error(f"Failed to create Google Calendar service: {e}")
        return None


def refresh_access_token(refresh_token: str) -> Optional[str]:
    """
    Refresh Google OAuth access token.
    
    Args:
        refresh_token: Google OAuth refresh token
    
    Returns:
        New access token or None
    """
    if not GOOGLE_CALENDAR_AVAILABLE:
        return None
    
    try:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET
        )
        
        creds.refresh(Request())
        return creds.token
    except Exception as e:
        logger.error(f"Failed to refresh access token: {e}")
        return None


def create_calendar_event(
    service: object,
    summary: str,
    description: str,
    start_time: datetime,
    end_time: datetime,
    attendee_email: Optional[str] = None,
    location: Optional[str] = None
) -> Optional[str]:
    """
    Create a Google Calendar event.
    
    Args:
        service: Google Calendar service object
        summary: Event title
        description: Event description
        start_time: Event start time (timezone-aware)
        end_time: Event end time (timezone-aware)
        attendee_email: Attendee email (optional)
        location: Event location (optional)
    
    Returns:
        Google Calendar event ID or None
    """
    if not GOOGLE_CALENDAR_AVAILABLE or service is None:
        return None
    
    try:
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': str(start_time.tzinfo),
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': str(end_time.tzinfo),
            },
        }
        
        if attendee_email:
            event['attendees'] = [{'email': attendee_email}]
        
        if location:
            event['location'] = location
        
        created_event = service.events().insert(calendarId='primary', body=event).execute()
        logger.info(f"✅ Created Google Calendar event: {created_event.get('id')}")
        return created_event.get('id')
    except Exception as e:
        logger.error(f"Failed to create Google Calendar event: {e}")
        return None


def update_calendar_event(
    service: object,
    event_id: str,
    summary: Optional[str] = None,
    description: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    status: Optional[str] = None
) -> bool:
    """
    Update a Google Calendar event.
    
    Args:
        service: Google Calendar service object
        event_id: Google Calendar event ID
        summary: New event title (optional)
        description: New event description (optional)
        start_time: New start time (optional)
        end_time: New end time (optional)
        status: Event status - "cancelled" to cancel (optional)
    
    Returns:
        True if updated successfully
    """
    if not GOOGLE_CALENDAR_AVAILABLE or service is None:
        return False
    
    try:
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        if summary:
            event['summary'] = summary
        if description:
            event['description'] = description
        if start_time:
            event['start'] = {
                'dateTime': start_time.isoformat(),
                'timeZone': str(start_time.tzinfo),
            }
        if end_time:
            event['end'] = {
                'dateTime': end_time.isoformat(),
                'timeZone': str(end_time.tzinfo),
            }
        if status == "cancelled":
            event['status'] = 'cancelled'
        
        service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
        logger.info(f"✅ Updated Google Calendar event: {event_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to update Google Calendar event: {e}")
        return False


def delete_calendar_event(service: object, event_id: str) -> bool:
    """
    Delete a Google Calendar event.
    
    Args:
        service: Google Calendar service object
        event_id: Google Calendar event ID
    
    Returns:
        True if deleted successfully
    """
    if not GOOGLE_CALENDAR_AVAILABLE or service is None:
        return False
    
    try:
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        logger.info(f"✅ Deleted Google Calendar event: {event_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete Google Calendar event: {e}")
        return False


def create_booking_calendar_event(
    access_token: str,
    refresh_token: Optional[str],
    customer_name: str,
    customer_email: str,
    provider_name: str,
    service_name: str,
    booking_date: datetime,
    end_date: datetime,
    notes: Optional[str] = None,
    location: Optional[str] = None
) -> Optional[str]:
    """
    Create a Google Calendar event for a booking.
    
    Args:
        access_token: Provider's Google OAuth access token
        refresh_token: Provider's Google OAuth refresh token
        customer_name: Customer name
        customer_email: Customer email
        provider_name: Provider name
        service_name: Service name
        booking_date: Booking start time
        end_date: Booking end time
        notes: Booking notes
        location: Service location
    
    Returns:
        Google Calendar event ID or None
    """
    service = get_google_calendar_service(access_token, refresh_token)
    if not service:
        return None
    
    summary = f"{service_name} - {customer_name}"
    description = f"""
Service: {service_name}
Provider: {provider_name}
Customer: {customer_name}
{f'Notes: {notes}' if notes else ''}
    """.strip()
    
    return create_calendar_event(
        service=service,
        summary=summary,
        description=description,
        start_time=booking_date,
        end_time=end_date,
        attendee_email=customer_email,
        location=location
    )

