# Payment Integration Setup Guide

## Overview
This system uses **Stripe** for online payment processing. Stripe offers a free test mode for development and testing.

## Features
- ✅ Secure payment processing via Stripe
- ✅ Payment status tracking (unpaid, pending, paid, refunded, failed)
- ✅ Integration with booking system
- ✅ Webhook support for real-time payment updates
- ✅ Support for multiple payment methods (cards, etc.)

## Setup Instructions

### 1. Install Stripe Package
```bash
cd backend
pip install stripe
# Or add to requirements.txt (already added)
```

### 2. Get Stripe API Keys

1. **Sign up for Stripe** (free): https://stripe.com
2. **Get your API keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable Key** (starts with `pk_test_`)
   - Copy your **Secret Key** (starts with `sk_test_`)

### 3. Configure Environment Variables

Create or update `.env` file in the `backend` directory:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Optional, for webhooks
```

### 4. Frontend Stripe Setup

Install Stripe.js in the frontend:

```bash
cd glowsense-web
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Add Stripe Publishable Key to your frontend environment (`.env.local`):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Database Structure

### `payments` Table
- `id`: Payment record ID
- `booking_id`: Reference to booking
- `customer_id`: Customer who made payment
- `provider_id`: Service provider receiving payment
- `amount`: Payment amount (e.g., "50.00")
- `currency`: Currency code (default: "USD")
- `stripe_payment_intent_id`: Stripe Payment Intent ID
- `stripe_charge_id`: Stripe Charge ID
- `stripe_customer_id`: Stripe Customer ID
- `status`: Payment status (pending, succeeded, failed, refunded)
- `created_at`, `paid_at`, `refunded_at`: Timestamps

### `bookings` Table (Updated)
- `payment_status`: unpaid, pending, paid, refunded, failed
- `payment_id`: Reference to payment record

## API Endpoints

### 1. Create Payment Intent
**POST** `/payments/create-intent`
- Creates a Stripe Payment Intent for a booking
- Returns `client_secret` for frontend Stripe Elements

**Request:**
```json
{
  "booking_id": 123
}
```

**Response:**
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "amount": 50.00,
  "currency": "usd",
  "payment_id": 1
}
```

### 2. Confirm Payment
**POST** `/payments/confirm`
- Confirms payment after Stripe payment succeeds
- Updates payment and booking status

**Request:**
```json
{
  "payment_intent_id": "pi_xxx",
  "booking_id": 123
}
```

### 3. Get Payment Details
**GET** `/payments/{payment_id}`
- Returns payment details for a specific payment

### 4. Stripe Webhook
**POST** `/payments/webhook`
- Handles Stripe webhook events
- Updates payment status automatically
- Requires `STRIPE_WEBHOOK_SECRET` in environment

## Payment Flow

1. **Customer makes booking** → Booking created with `payment_status = "unpaid"`
2. **Customer initiates payment** → Frontend calls `/payments/create-intent`
3. **Stripe Payment Intent created** → Returns `client_secret`
4. **Customer enters card details** → Stripe Elements handles securely
5. **Payment submitted** → Stripe processes payment
6. **Payment confirmed** → Frontend calls `/payments/confirm`
7. **Booking updated** → `payment_status = "paid"`

## Testing with Stripe Test Cards

Use these test card numbers in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Frontend Implementation

The frontend payment component should:
1. Use Stripe Elements for secure card input
2. Call `/payments/create-intent` to get `client_secret`
3. Use Stripe.js to confirm payment
4. Call `/payments/confirm` after successful payment
5. Update UI to show payment status

## Security Notes

- ✅ Never expose Stripe Secret Key in frontend
- ✅ Always use HTTPS in production
- ✅ Validate webhook signatures
- ✅ Store sensitive data securely
- ✅ Use Stripe test mode for development

## Next Steps

1. Install Stripe package: `pip install stripe`
2. Add Stripe keys to `.env`
3. Install Stripe.js in frontend: `npm install @stripe/stripe-js @stripe/react-stripe-js`
4. Create payment UI component
5. Integrate with booking flow
6. Test with Stripe test cards

