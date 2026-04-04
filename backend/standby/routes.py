"""
Standby Support System API Routes
Handles provider cancellation, standby provider search, customer selection, and refunds.
"""
import json
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import auth
import models

# Optional Stripe import
stripe = None
try:
    import stripe as _stripe
    stripe = _stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    if not stripe.api_key:
        stripe = None
except ImportError:
    pass

router = APIRouter(prefix="/standby", tags=["Standby Support"])
security = HTTPBearer()


# ────────────────────────────────────────────────
# Auth helpers (mirror main.py helpers)
# ────────────────────────────────────────────────

def get_current_provider(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role != "provider":
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    provider = db.query(models.ServiceProvider).filter(models.ServiceProvider.email == email).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role != "customer":
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    customer = db.query(models.Customer).filter(models.Customer.email == email).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# ────────────────────────────────────────────────
# Pydantic schemas
# ────────────────────────────────────────────────

class SelectStandbyProvider(BaseModel):
    booking_id: int
    new_provider_id: int


class RefundRequest(BaseModel):
    booking_id: int


# ────────────────────────────────────────────────
# 1. Provider cancels a confirmed booking
# ────────────────────────────────────────────────

@router.put("/provider/cancel-booking/{booking_id}")
async def provider_cancel_booking(
    booking_id: int,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Provider cancels a confirmed booking.
    - Sets status to 'cancelled_by_provider'
    - Finds standby providers (same category, same city, available slot)
    - Creates a notification for the customer
    - Creates notifications for each standby provider
    """
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.provider_id == current_provider.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status not in ("confirmed", "accepted"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel booking with status '{booking.status}'. Only confirmed or accepted bookings can be cancelled.",
        )

    # ── Update booking status ──────────────────────────
    booking.status = "cancelled_by_provider"
    booking.booking_status = "cancelled_by_provider"

    # ── Save original provider ID for tracking ─────────
    if not booking.original_provider_id:
        booking.original_provider_id = current_provider.id

    # ── Free up the time slot ──────────────────────────
    if booking.time_slot_id:
        time_slot = db.query(models.TimeSlot).filter(
            models.TimeSlot.id == booking.time_slot_id
        ).first()
        if time_slot:
            time_slot.is_available = True
        # Detach time slot from booking so it's fully free
        booking.time_slot_id = None

    # ── Find standby providers ─────────────────────────
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    category = service.category if service else None

    standby_providers = _find_standby_providers(
        db=db,
        category=category,
        city=current_provider.city,
        booking_date=booking.booking_date,
        exclude_provider_id=current_provider.id,
    )

    # Serialise standby list for notification payload
    standby_list = [
        {
            "id": sp["id"],
            "full_name": sp["full_name"],
            "business_name": sp["business_name"],
            "city": sp["city"],
            "level": sp["level"],
            "average_rating": sp["average_rating"],
        }
        for sp in standby_providers
    ]

    # ── 🔔 Customer Notification ───────────────────────
    customer = db.query(models.Customer).filter(models.Customer.id == booking.customer_id).first()
    customer_notification = models.Notification(
        customer_id=booking.customer_id,
        booking_id=booking.id,
        type="booking_cancelled_by_provider",
        title="Booking Cancelled by Provider",
        message=(
            f"Your booking for '{service.name if service else 'Service'}' on "
            f"{booking.booking_date.strftime('%b %d, %Y %I:%M %p')} has been cancelled by "
            f"{current_provider.full_name or current_provider.business_name}. "
            f"{'We found ' + str(len(standby_list)) + ' standby providers for you.' if standby_list else 'No standby providers available. You can request a refund.'}"
        ),
        data=json.dumps({"standby_providers": standby_list, "booking_id": booking.id}),
    )
    db.add(customer_notification)

    # ── 🔔 Provider Notifications (standby providers) ──
    for sp in standby_list:
        provider_notification = models.Notification(
            provider_id=sp["id"],
            booking_id=booking.id,
            type="standby_added",
            title="Added to Standby List",
            message=(
                f"You have been added to the standby list for a '{service.name if service else 'Service'}' booking "
                f"on {booking.booking_date.strftime('%b %d, %Y %I:%M %p')}. "
                f"A customer may select you as a replacement provider."
            ),
            data=json.dumps({"booking_id": booking.id}),
        )
        db.add(provider_notification)

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking cancelled. Standby providers found.",
        "booking_id": booking.id,
        "status": booking.status,
        "standby_providers": standby_list,
    }


# ────────────────────────────────────────────────
# 2. Get standby providers for a cancelled booking
# ────────────────────────────────────────────────

@router.get("/providers/{booking_id}")
async def get_standby_providers(
    booking_id: int,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Return list of standby providers for a booking that was cancelled by provider."""
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.customer_id == current_customer.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "cancelled_by_provider":
        raise HTTPException(status_code=400, detail="Booking was not cancelled by provider")

    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    original_provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == booking.original_provider_id or models.ServiceProvider.id == booking.provider_id
    ).first()

    category = service.category if service else None
    city = original_provider.city if original_provider else None

    standby = _find_standby_providers(
        db=db,
        category=category,
        city=city,
        booking_date=booking.booking_date,
        exclude_provider_id=booking.provider_id,
    )

    return {
        "booking_id": booking_id,
        "original_service": service.name if service else None,
        "original_provider": original_provider.full_name if original_provider else None,
        "booking_date": booking.booking_date.isoformat(),
        "standby_providers": standby,
    }


# ────────────────────────────────────────────────
# 3. Customer selects a standby provider
# ────────────────────────────────────────────────

@router.post("/select-provider")
async def select_standby_provider(
    body: SelectStandbyProvider,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Customer picks a standby provider → status = standby_pending (awaiting provider acceptance)."""
    booking = db.query(models.Booking).filter(
        models.Booking.id == body.booking_id,
        models.Booking.customer_id == current_customer.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "cancelled_by_provider":
        raise HTTPException(status_code=400, detail="Booking is not in 'cancelled_by_provider' state")

    # Verify the new provider exists and is active
    new_provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == body.new_provider_id,
        models.ServiceProvider.is_active == True,
    ).first()

    if not new_provider:
        raise HTTPException(status_code=404, detail="Selected provider not found or inactive")

    # Save original provider id if not already saved
    if not booking.original_provider_id:
        booking.original_provider_id = booking.provider_id

    # Update booking — set to standby_pending so the provider can accept/reject
    booking.provider_id = new_provider.id
    booking.assigned_provider_id = new_provider.id
    booking.status = "standby_pending"
    booking.booking_status = "standby_pending"
    # Payment stays in escrow — no change to payment_status

    # Notification for the selected standby provider — they need to accept/reject
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    notif = models.Notification(
        provider_id=new_provider.id,
        booking_id=booking.id,
        type="standby_selected",
        title="New Standby Booking Request",
        message=(
            f"A customer has selected you as their replacement provider for "
            f"'{service.name if service else 'Service'}' on "
            f"{booking.booking_date.strftime('%b %d, %Y %I:%M %p')}. "
            f"Please accept or reject this booking from your dashboard."
        ),
        data=json.dumps({"booking_id": booking.id}),
    )
    db.add(notif)

    db.commit()
    db.refresh(booking)

    return {
        "message": "Standby provider selected. Waiting for provider to accept.",
        "booking_id": booking.id,
        "new_provider_id": new_provider.id,
        "new_provider_name": new_provider.full_name,
        "status": booking.status,
        "payment_status": booking.payment_status,
    }


# ────────────────────────────────────────────────
# 3b. Standby provider accepts or rejects booking
# ────────────────────────────────────────────────

class StandbyResponse(BaseModel):
    booking_id: int
    action: str  # "accept" or "reject"


@router.post("/provider/respond")
async def standby_provider_respond(
    body: StandbyResponse,
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Standby provider accepts or rejects the booking.
    - accept: booking.status → 'accepted', service/price updated to provider's service, customer can pay.
    - reject: booking.status → 'cancelled_by_provider', customer is notified to pick another or refund.
    """
    if body.action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'reject'")

    booking = db.query(models.Booking).filter(
        models.Booking.id == body.booking_id,
        models.Booking.provider_id == current_provider.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not assigned to you")

    if booking.status != "standby_pending":
        raise HTTPException(status_code=400, detail=f"Booking is not in 'standby_pending' state (current: {booking.status})")

    customer = db.query(models.Customer).filter(models.Customer.id == booking.customer_id).first()
    old_service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()

    if body.action == "accept":
        # ── Find the standby provider's matching service ──────────
        # Look for a service from this provider in the same category
        category = old_service.category if old_service else None
        new_service = None
        if category:
            new_service = (
                db.query(models.Service)
                .filter(
                    models.Service.provider_id == current_provider.id,
                    models.Service.category == category,
                    models.Service.is_active == True,
                )
                .first()
            )
        # Fallback: if no category match, pick the first active service
        if not new_service:
            new_service = (
                db.query(models.Service)
                .filter(
                    models.Service.provider_id == current_provider.id,
                    models.Service.is_active == True,
                )
                .first()
            )

        if not new_service:
            raise HTTPException(status_code=400, detail="Standby provider has no active services")

        # ── Parse prices ──────────────────────────────────────────
        def _parse_price(price_str: str) -> float:
            """Parse price string like '$40', '40.00', '40-60' → float."""
            cleaned = price_str.replace("$", "").replace(",", "").strip()
            if "-" in cleaned:
                cleaned = cleaned.split("-")[0].strip()
            return float(cleaned)

        original_price = _parse_price(old_service.price) if old_service else 0.0
        standby_price = _parse_price(new_service.price)
        price_diff = standby_price - original_price  # positive = higher, negative = lower

        # ── Update booking to standby provider's service ──────────
        booking.service_id = new_service.id
        booking.provider_id = current_provider.id
        booking.assigned_provider_id = current_provider.id

        # ── Payment Adjustment Cases ──────────────────────────────

        if abs(price_diff) < 0.01:
            # ═══ CASE 3: Equal price — just swap provider ═════════
            booking.status = "confirmed"
            booking.booking_status = "confirmed"
            # Payment stays in escrow, no change
            adjustment_msg = (
                f"Great news! {current_provider.full_name or current_provider.business_name} has accepted "
                f"your booking at the same price (${standby_price:.2f}). No payment changes needed."
            )

        elif price_diff < 0:
            # ═══ CASE 1: Standby price LOWER — partial refund ═════
            refund_amount = abs(price_diff)
            refund_cents = int(refund_amount * 100)

            if booking.payment_status == "HELD_IN_ESCROW" and booking.stripe_payment_intent_id and stripe:
                try:
                    refund = stripe.Refund.create(
                        payment_intent=booking.stripe_payment_intent_id,
                        amount=refund_cents,  # Partial refund
                    )
                    booking.stripe_refund_id = refund.id
                    # Update payment record amount to new (lower) price
                    old_payment = db.query(models.Payment).filter(
                        models.Payment.booking_id == booking.id
                    ).first()
                    if old_payment:
                        old_payment.amount = str(standby_price)
                        old_payment.provider_id = current_provider.id
                except Exception as e:
                    print(f"Warning: Partial refund failed: {e}")

            booking.status = "confirmed"
            booking.booking_status = "confirmed"
            # Payment remains HELD_IN_ESCROW (just a smaller amount now)
            adjustment_msg = (
                f"{current_provider.full_name or current_provider.business_name} has accepted your booking. "
                f"The new price is ${standby_price:.2f} (was ${original_price:.2f}). "
                f"A refund of ${refund_amount:.2f} has been issued to your card."
            )

        else:
            # ═══ CASE 2: Standby price HIGHER — customer pays extra ═
            extra_amount = price_diff  # positive value

            booking.status = "awaiting_extra_payment"
            booking.booking_status = "awaiting_extra_payment"
            # Keep existing escrow payment intact
            adjustment_msg = (
                f"{current_provider.full_name or current_provider.business_name} has accepted your booking. "
                f"The new price is ${standby_price:.2f} (was ${original_price:.2f}). "
                f"Please pay the additional ${extra_amount:.2f} to confirm your booking."
            )

        # Notify customer
        notif = models.Notification(
            customer_id=booking.customer_id,
            booking_id=booking.id,
            type="standby_accepted",
            title="Standby Provider Accepted!",
            message=adjustment_msg,
            data=json.dumps({
                "booking_id": booking.id,
                "new_service_name": new_service.name,
                "new_service_price": new_service.price,
                "original_price": str(original_price),
                "price_difference": str(price_diff),
                "provider_name": current_provider.full_name or current_provider.business_name,
            }),
        )
        db.add(notif)
        db.commit()
        db.refresh(booking)

        return {
            "message": "Booking accepted.",
            "booking_id": booking.id,
            "status": booking.status,
            "new_service": {"id": new_service.id, "name": new_service.name, "price": new_service.price},
            "original_price": original_price,
            "standby_price": standby_price,
            "price_difference": round(price_diff, 2),
        }

    else:  # reject
        # Revert booking back to cancelled_by_provider so customer can pick another
        booking.provider_id = booking.original_provider_id or booking.provider_id
        booking.assigned_provider_id = None
        booking.status = "cancelled_by_provider"
        booking.booking_status = "cancelled_by_provider"

        # Notify customer — standby provider rejected
        notif = models.Notification(
            customer_id=booking.customer_id,
            booking_id=booking.id,
            type="standby_rejected",
            title="Standby Provider Declined",
            message=(
                f"{current_provider.full_name or current_provider.business_name} has declined the booking. "
                f"You can select another standby provider or request a refund."
            ),
            data=json.dumps({"booking_id": booking.id}),
        )
        db.add(notif)
        db.commit()
        db.refresh(booking)

        return {
            "message": "Booking rejected. Customer has been notified.",
            "booking_id": booking.id,
            "status": booking.status,
        }


# ────────────────────────────────────────────────
# 3c. Pay the price difference (Case 2)
# ────────────────────────────────────────────────

class PayDifferenceCreate(BaseModel):
    booking_id: int


@router.post("/pay-difference/create-intent")
async def create_difference_intent(
    body: PayDifferenceCreate,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """
    Create a Stripe PaymentIntent for ONLY the price difference
    when the standby provider costs more than the original.
    """
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")

    booking = db.query(models.Booking).filter(
        models.Booking.id == body.booking_id,
        models.Booking.customer_id == current_customer.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "awaiting_extra_payment":
        raise HTTPException(
            status_code=400,
            detail=f"Booking is not awaiting extra payment (current: {booking.status})"
        )

    # Calculate the difference
    new_service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    if not new_service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Get the original payment amount already in escrow
    existing_payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking.id,
        models.Payment.status == "succeeded",
    ).first()

    original_paid = float(existing_payment.amount) if existing_payment else 0.0

    # Parse the new (higher) service price
    price_str = new_service.price.replace("$", "").replace(",", "").strip()
    if "-" in price_str:
        price_str = price_str.split("-")[0].strip()
    new_total = float(price_str)

    extra_amount = new_total - original_paid
    if extra_amount <= 0:
        raise HTTPException(status_code=400, detail="No additional payment required")

    extra_cents = int(extra_amount * 100)

    try:
        intent = stripe.PaymentIntent.create(
            amount=extra_cents,
            currency="usd",
            metadata={
                "booking_id": booking.id,
                "customer_id": current_customer.id,
                "provider_id": booking.provider_id,
                "type": "standby_difference",
                "original_paid": str(original_paid),
                "new_total": str(new_total),
            },
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "extra_amount": extra_amount,
            "original_paid": original_paid,
            "new_total": new_total,
            "currency": "usd",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


class PayDifferenceConfirm(BaseModel):
    booking_id: int
    payment_intent_id: str


@router.post("/pay-difference/confirm")
async def confirm_difference_payment(
    body: PayDifferenceConfirm,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """
    Confirm that the extra payment succeeded.
    Updates booking to 'confirmed' and total escrow to the full standby price.
    """
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")

    booking = db.query(models.Booking).filter(
        models.Booking.id == body.booking_id,
        models.Booking.customer_id == current_customer.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "awaiting_extra_payment":
        raise HTTPException(status_code=400, detail="Booking is not awaiting extra payment")

    try:
        intent = stripe.PaymentIntent.retrieve(body.payment_intent_id)
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail=f"Payment not succeeded (status: {intent.status})")

        # Get new total from service
        new_service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
        price_str = new_service.price.replace("$", "").replace(",", "").strip() if new_service else "0"
        if "-" in price_str:
            price_str = price_str.split("-")[0].strip()
        new_total = float(price_str)

        # Update the existing payment record to reflect the new total
        existing_payment = db.query(models.Payment).filter(
            models.Payment.booking_id == booking.id,
        ).first()
        if existing_payment:
            existing_payment.amount = str(new_total)
            existing_payment.provider_id = booking.provider_id

        # Update booking status
        booking.status = "confirmed"
        booking.booking_status = "confirmed"
        booking.payment_status = "HELD_IN_ESCROW"

        # Notify customer
        notif = models.Notification(
            customer_id=booking.customer_id,
            booking_id=booking.id,
            type="extra_payment_confirmed",
            title="Payment Complete!",
            message=(
                f"Your additional payment has been processed. "
                f"Your booking is now confirmed at the total price of ${new_total:.2f}."
            ),
            data=json.dumps({"booking_id": booking.id}),
        )
        db.add(notif)
        db.commit()
        db.refresh(booking)

        return {
            "message": "Extra payment confirmed. Booking is now confirmed.",
            "booking_id": booking.id,
            "status": booking.status,
            "total_amount": new_total,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to confirm payment: {str(e)}")


@router.post("/refund")
async def request_refund(
    body: RefundRequest,
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Process Stripe refund and update booking + payment status."""
    booking = db.query(models.Booking).filter(
        models.Booking.id == body.booking_id,
        models.Booking.customer_id == current_customer.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "cancelled_by_provider":
        raise HTTPException(status_code=400, detail="Refund is only available for bookings cancelled by the provider")

    if booking.payment_status not in ("HELD_IN_ESCROW",):
        raise HTTPException(status_code=400, detail=f"Cannot refund. Current payment status: {booking.payment_status}")

    if not booking.stripe_payment_intent_id:
        raise HTTPException(status_code=400, detail="No Stripe payment intent found for this booking")

    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe payment integration is not available")

    # ── Call Stripe Refund API ──────────────────────────
    try:
        refund = stripe.Refund.create(payment_intent=booking.stripe_payment_intent_id)

        # Update booking
        booking.status = "refunded"
        booking.booking_status = "refunded"
        booking.payment_status = "REFUNDED"
        booking.stripe_refund_id = refund.id

        # Update payment record
        payment = db.query(models.Payment).filter(models.Payment.booking_id == booking.id).first()
        if payment:
            payment.status = "refunded"
            payment.refunded_at = datetime.now(ZoneInfo("UTC"))

        # Notification for customer
        service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
        notif = models.Notification(
            customer_id=current_customer.id,
            booking_id=booking.id,
            type="refund_processed",
            title="Refund Processed",
            message=(
                f"Your refund for '{service.name if service else 'Service'}' has been processed successfully. "
                f"The amount will be returned to your original payment method within 5-10 business days."
            ),
            data=json.dumps({"booking_id": booking.id, "refund_id": refund.id}),
        )
        db.add(notif)

        db.commit()
        db.refresh(booking)

        return {
            "message": "Refund processed successfully",
            "booking_id": booking.id,
            "refund_id": refund.id,
            "status": booking.status,
            "payment_status": booking.payment_status,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Refund failed: {str(e)}")


# ────────────────────────────────────────────────
# 5. Notification endpoints
# ────────────────────────────────────────────────

@router.get("/notifications/customer")
async def get_customer_notifications(
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Get all notifications for the logged-in customer."""
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.customer_id == current_customer.id)
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "data": json.loads(n.data) if n.data else None,
            "booking_id": n.booking_id,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.get("/notifications/provider")
async def get_provider_notifications(
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """Get all notifications for the logged-in provider."""
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.provider_id == current_provider.id)
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "data": json.loads(n.data) if n.data else None,
            "booking_id": n.booking_id,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.get("/notifications/customer/unread-count")
async def get_customer_unread_count(
    current_customer: models.Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Get unread notification count for customer (for bell badge)."""
    count = (
        db.query(func.count(models.Notification.id))
        .filter(
            models.Notification.customer_id == current_customer.id,
            models.Notification.is_read == False,
        )
        .scalar()
    )
    return {"unread_count": count or 0}


@router.get("/notifications/provider/unread-count")
async def get_provider_unread_count(
    current_provider: models.ServiceProvider = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """Get unread notification count for provider (for bell badge)."""
    count = (
        db.query(func.count(models.Notification.id))
        .filter(
            models.Notification.provider_id == current_provider.id,
            models.Notification.is_read == False,
        )
        .scalar()
    )
    return {"unread_count": count or 0}


# ────────────────────────────────────────────────
# ⚙️  Internal helper – standby provider search
# ────────────────────────────────────────────────

def _find_standby_providers(
    db: Session,
    category: str | None,
    city: str | None,
    booking_date: datetime,
    exclude_provider_id: int,
) -> list[dict]:
    """
    Search for standby providers that:
    1. Have the same service category
    2. Are in the same city
    3. Have available time slots near the booking date
    4. Are NOT the original provider
    """
    # 1. Find providers in the same city with same-category services
    query = (
        db.query(models.ServiceProvider)
        .join(models.Service, models.Service.provider_id == models.ServiceProvider.id)
        .filter(
            models.ServiceProvider.is_active == True,
            models.ServiceProvider.id != exclude_provider_id,
        )
    )

    if city:
        query = query.filter(models.ServiceProvider.city == city)
    if category:
        query = query.filter(models.Service.category == category)

    candidates = query.distinct().all()

    # 2. For each candidate, check they have a free time slot on the same date
    standby = []
    # Determine the day window around the booking date (same day)
    day_start = booking_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    for provider in candidates:
        # Get provider services in category
        provider_services = (
            db.query(models.Service)
            .filter(
                models.Service.provider_id == provider.id,
                models.Service.is_active == True,
            )
        )
        if category:
            provider_services = provider_services.filter(models.Service.category == category)
        provider_services = provider_services.all()

        service_ids = [s.id for s in provider_services]
        if not service_ids:
            continue

        # Check for available time slots on the same day
        available_slot = (
            db.query(models.TimeSlot)
            .filter(
                models.TimeSlot.service_id.in_(service_ids),
                models.TimeSlot.slot_date >= day_start,
                models.TimeSlot.slot_date < day_end,
                models.TimeSlot.is_available == True,
            )
            .first()
        )

        if not available_slot:
            continue

        # Get average rating
        avg_rating = (
            db.query(func.avg(models.Rating.rating))
            .filter(models.Rating.provider_id == provider.id)
            .scalar()
        ) or 0

        standby.append({
            "id": provider.id,
            "full_name": provider.full_name,
            "business_name": provider.business_name,
            "email": provider.email,
            "phone": provider.phone,
            "city": provider.city,
            "level": provider.level or "beginner",
            "average_rating": round(float(avg_rating), 2),
            "profile_picture": provider.profile_picture or provider.profile_photo,
            "available_slot_time": available_slot.slot_date.isoformat(),
        })

    return standby
