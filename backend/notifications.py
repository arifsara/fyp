"""
Notification system for booking events
"""
import logging
from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)


def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None
) -> bool:
    """
    Send email notification (mock implementation).
    In production, integrate with SendGrid, AWS SES, or similar.
    
    Args:
        to_email: Recipient email
        subject: Email subject
        body: Plain text body
        html_body: HTML body (optional)
    
    Returns:
        True if sent successfully
    """
    logger.info(f"📧 Email sent to {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    # TODO: Integrate with actual email service
    return True


def send_sms_notification(
    to_phone: str,
    message: str
) -> bool:
    """
    Send SMS notification (mock implementation).
    In production, integrate with Twilio, AWS SNS, or similar.
    
    Args:
        to_phone: Recipient phone number
        message: SMS message
    
    Returns:
        True if sent successfully
    """
    logger.info(f"📱 SMS sent to {to_phone}")
    logger.info(f"Message: {message}")
    # TODO: Integrate with actual SMS service
    return True


def notify_booking_created(
    customer_email: str,
    customer_name: str,
    provider_name: str,
    service_name: str,
    booking_date: datetime,
    booking_id: int
) -> None:
    """
    Send notification when a booking is created.
    """
    booking_date_str = booking_date.strftime("%Y-%m-%d %H:%M")
    
    subject = f"Booking Confirmation - {service_name}"
    body = f"""
Hello {customer_name},

Your booking has been created successfully!

Service: {service_name}
Provider: {provider_name}
Date & Time: {booking_date_str}
Booking ID: #{booking_id}

The provider will review and confirm your booking shortly.

Thank you for choosing GlowSense AI!
"""
    
    send_email_notification(customer_email, subject, body)


def notify_booking_accepted(
    customer_email: str,
    customer_name: str,
    provider_name: str,
    service_name: str,
    booking_date: datetime
) -> None:
    """
    Send notification when provider accepts a booking.
    """
    booking_date_str = booking_date.strftime("%Y-%m-%d %H:%M")
    
    subject = f"Booking Confirmed - {service_name}"
    body = f"""
Hello {customer_name},

Great news! Your booking has been confirmed.

Service: {service_name}
Provider: {provider_name}
Date & Time: {booking_date_str}

We look forward to seeing you!

Best regards,
GlowSense AI Team
"""
    
    send_email_notification(customer_email, subject, body)


def notify_booking_rejected(
    customer_email: str,
    customer_name: str,
    provider_name: str,
    service_name: str,
    booking_date: datetime
) -> None:
    """
    Send notification when provider rejects a booking.
    """
    booking_date_str = booking_date.strftime("%Y-%m-%d %H:%M")
    
    subject = f"Booking Update - {service_name}"
    body = f"""
Hello {customer_name},

Unfortunately, your booking request could not be confirmed.

Service: {service_name}
Provider: {provider_name}
Requested Date & Time: {booking_date_str}

Please try booking another time slot or contact the provider directly.

We apologize for any inconvenience.

Best regards,
GlowSense AI Team
"""
    
    send_email_notification(customer_email, subject, body)


def notify_booking_cancelled(
    customer_email: str,
    customer_name: str,
    provider_name: str,
    service_name: str,
    booking_date: datetime,
    cancelled_by: str  # "customer" or "provider"
) -> None:
    """
    Send notification when a booking is cancelled.
    """
    booking_date_str = booking_date.strftime("%Y-%m-%d %H:%M")
    
    cancelled_by_text = "you" if cancelled_by == "customer" else "the provider"
    
    subject = f"Booking Cancelled - {service_name}"
    body = f"""
Hello {customer_name},

Your booking has been cancelled by {cancelled_by_text}.

Service: {service_name}
Provider: {provider_name}
Date & Time: {booking_date_str}

If you need to reschedule, please create a new booking.

Best regards,
GlowSense AI Team
"""
    
    send_email_notification(customer_email, subject, body)


def notify_booking_reminder(
    customer_email: str,
    customer_phone: Optional[str],
    customer_name: str,
    provider_name: str,
    service_name: str,
    booking_date: datetime,
    hours_before: int = 24
) -> None:
    """
    Send reminder notification before appointment.
    """
    booking_date_str = booking_date.strftime("%Y-%m-%d %H:%M")
    
    subject = f"Reminder: Upcoming Appointment - {service_name}"
    body = f"""
Hello {customer_name},

This is a reminder about your upcoming appointment.

Service: {service_name}
Provider: {provider_name}
Date & Time: {booking_date_str}

Your appointment is in {hours_before} hours. We look forward to seeing you!

Best regards,
GlowSense AI Team
"""
    
    send_email_notification(customer_email, subject, body)
    
    if customer_phone:
        sms_message = f"Reminder: You have an appointment with {provider_name} for {service_name} on {booking_date_str}. See you soon!"
        send_sms_notification(customer_phone, sms_message)

