from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Time, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Google users
    full_name = Column(String)
    phone = Column(String)
    location = Column(String, nullable=True)  # Customer location/city
    profile_picture = Column(String, nullable=True)  # URL from Google
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Google OAuth
    google_id = Column(String, nullable=True, index=True)
    
    # Relationships
    payments = relationship("Payment", back_populates="customer", foreign_keys="Payment.customer_id")


class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Google users
    full_name = Column(String)
    business_name = Column(String)
    phone = Column(String)
    city = Column(String)
    bio = Column(Text)
    profile_photo = Column(String, nullable=True)  # File path or URL
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # New fields for provider signup
    cnic_id = Column(String, nullable=True)  # CNIC/ID Number
    certificates = Column(Text, nullable=True)  # Certifications/Qualifications
    business_license = Column(String, nullable=True)  # Business license file path or number
    
    # Google OAuth
    google_id = Column(String, nullable=True, index=True)  # Removed unique=True to allow multiple NULLs
    profile_picture = Column(String, nullable=True)  # URL from Google
    
    # Timezone and Calendar Integration
    timezone = Column(String, default="UTC")  # e.g., "America/New_York", "Asia/Karachi"
    google_calendar_id = Column(String, nullable=True)  # Google Calendar ID for integration
    google_calendar_access_token = Column(Text, nullable=True)  # Encrypted access token
    google_calendar_refresh_token = Column(Text, nullable=True)  # Encrypted refresh token
    
    # Provider Level (based on ratings)
    level = Column(String, default="beginner")  # beginner, skilled, expert
    
    # Relationships
    portfolio_items = relationship("PortfolioItem", back_populates="provider", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="provider", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="provider", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="provider", foreign_keys="Payment.provider_id")


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    provider = relationship("ServiceProvider", back_populates="portfolio_items")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    price = Column(String, nullable=False)
    duration = Column(String, nullable=True)  # e.g., "60 minutes"
    is_active = Column(Boolean, default=True)
    availability_schedule = Column(Text, nullable=True)  # JSON string for backward compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    provider = relationship("ServiceProvider", back_populates="services")
    bookings = relationship("Booking", back_populates="service", cascade="all, delete-orphan")
    time_slots = relationship("TimeSlot", back_populates="service", cascade="all, delete-orphan")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    slot_date = Column(DateTime(timezone=True), nullable=False)
    is_available = Column(Boolean, default=True)  # Can be marked unavailable by provider
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    service = relationship("Service", back_populates="time_slots")
    booking = relationship("Booking", back_populates="time_slot", uselist=False)  # One booking per slot


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=True)  # Reference to time slot
    booking_date = Column(DateTime(timezone=True), nullable=False)  # Kept for backward compatibility
    end_date = Column(DateTime(timezone=True), nullable=True)  # Calculated from service duration
    status = Column(String, default="pending")  # pending, confirmed, completed, cancelled, rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Google Calendar Integration
    google_calendar_event_id = Column(String, nullable=True)  # Google Calendar event ID
    
    # Notification tracking
    reminder_sent = Column(Boolean, default=False)
    
    # Payment Integration
    payment_status = Column(String, default="unpaid")  # unpaid, pending, paid, refunded, failed
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)  # Reference to payment
    
    customer = relationship("Customer")
    provider = relationship("ServiceProvider", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    time_slot = relationship("TimeSlot", back_populates="booking")
    payment = relationship("Payment", back_populates="booking", uselist=False, foreign_keys="[Payment.booking_id]", primaryjoin="Booking.id == Payment.booking_id")


class Rating(Base):
    """Customer rating for a completed booking/service."""
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    
    # Payment Details
    amount = Column(String, nullable=False)  # Amount in currency (e.g., "50.00")
    currency = Column(String, default="USD")  # Currency code
    payment_method = Column(String, nullable=True)  # card, bank_transfer, etc.
    
    # Stripe Integration
    stripe_payment_intent_id = Column(String, nullable=True, index=True)  # Stripe Payment Intent ID
    stripe_charge_id = Column(String, nullable=True)  # Stripe Charge ID
    stripe_customer_id = Column(String, nullable=True)  # Stripe Customer ID
    
    # Payment Status
    status = Column(String, default="pending")  # pending, succeeded, failed, refunded, cancelled
    failure_reason = Column(Text, nullable=True)  # Reason if payment failed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="payment", foreign_keys=[booking_id])
    customer = relationship("Customer", back_populates="payments", foreign_keys=[customer_id])
    provider = relationship("ServiceProvider", back_populates="payments", foreign_keys=[provider_id])


# Standby Support System Models
class StandbyQueue(Base):
    """Standby queue for service providers with free slots"""
    __tablename__ = "standby_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)  # Optional: specific service
    slot_date = Column(DateTime(timezone=True), nullable=False)  # Date/time of free slot
    slot_start_time = Column(Time, nullable=True)  # Start time of slot
    slot_end_time = Column(Time, nullable=True)  # End time of slot
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)  # 5 days from added_at
    is_active = Column(Boolean, default=True)  # Active in queue
    notified_provider = Column(Boolean, default=False)  # Whether provider was notified
    
    provider = relationship("ServiceProvider")
    service = relationship("Service")


class StandbyNotification(Base):
    """Notifications for providers about being added to standby"""
    __tablename__ = "standby_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    standby_queue_id = Column(Integer, ForeignKey("standby_queue.id"), nullable=True)
    message = Column(Text, nullable=False)
    days_shown = Column(Integer, default=5)  # Days to show (up to 5)
    shown_until = Column(DateTime(timezone=True), nullable=False)  # When to stop showing
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    provider = relationship("ServiceProvider")


class StandbyRequest(Base):
    """Customer requests for standby support after booking cancellation"""
    __tablename__ = "standby_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    cancelled_booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    original_booking_date = Column(DateTime(timezone=True), nullable=False)
    original_service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    status = Column(String, default="pending")  # pending, matched, completed, expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    matched_provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=True)
    matched_at = Column(DateTime(timezone=True), nullable=True)
    
    customer = relationship("Customer")
    cancelled_booking = relationship("Booking", foreign_keys=[cancelled_booking_id])
    original_service = relationship("Service", foreign_keys=[original_service_id])
    matched_provider = relationship("ServiceProvider", foreign_keys=[matched_provider_id])
