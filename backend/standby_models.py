"""
Standby Support System Models
Additional models for automated standby support functionality
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


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

