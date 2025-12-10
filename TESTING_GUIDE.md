# 🧪 Complete Testing Guide for GlowSense AI

## Prerequisites

1. **Backend running**: `cd backend && uvicorn main:app --reload --port 8000`
2. **Frontend running**: `cd glowsense-web && npm run dev`
3. **PostgreSQL running** with database `glowsense_db`
4. **Stripe keys configured** in `.env` files

---

## 📋 Testing Checklist

### 1. ✅ Authentication & User Management

#### Customer Signup & Login
- [ ] **Signup as Customer**
  - Go to: `http://localhost:3000/signup/customer`
  - Fill in: Name, Email, Password, Phone
  - Click "Sign Up"
  - Should redirect to customer dashboard

- [ ] **Login as Customer**
  - Go to: `http://localhost:3000/login/customer`
  - Enter credentials
  - Should redirect to customer dashboard
  - Check browser console for no errors

#### Service Provider Signup & Login
- [ ] **Signup as Provider**
  - Go to: `http://localhost:3000/signup/provider`
  - Fill in: Name, Email, Password, Phone, Business Name, City, Bio
  - Upload: CNIC, Certificates, Business License
  - Click "Sign Up"
  - Should redirect to portfolio page

- [ ] **Login as Provider**
  - Go to: `http://localhost:3000/login/provider`
  - Enter credentials
  - Should redirect to portfolio page
  - Check browser console for no errors

---

### 2. ✅ Service Provider Features

#### Portfolio Management
- [ ] **Add Portfolio Item**
  - Go to: `/dashboard/portfolio`
  - Click "Add Portfolio Item"
  - Upload image/video, add title, description, experience
  - Click "Save"
  - Item should appear in portfolio list

- [ ] **Edit Portfolio Item**
  - Click "Edit" on a portfolio item
  - Modify details
  - Click "Save"
  - Changes should be reflected

- [ ] **Delete Portfolio Item**
  - Click "Delete" on a portfolio item
  - Confirm deletion
  - Item should be removed

#### Service Management
- [ ] **Add Service**
  - Go to: `/dashboard/portfolio`
  - Click "Add Service"
  - Fill in: Name, Category, Description, Price, Duration
  - Click "Save"
  - Service should appear in services list

- [ ] **Edit Service**
  - Click "Edit" on a service
  - Modify details
  - Click "Save"
  - Changes should be reflected

- [ ] **Delete Service**
  - Click "Delete" on a service
  - Confirm deletion
  - Service should be removed

#### Time Slot Management
- [ ] **Add Time Slots (Bulk)**
  - Go to: `/dashboard/portfolio`
  - Click "Manage Time Slots" on a service
  - Click "Bulk Add Time Slots"
  - Select:
    - Date range (up to 3 months)
    - Days of week (e.g., Monday, Wednesday, Friday)
    - Start time (e.g., 09:00)
    - End time (e.g., 17:00)
    - Interval (e.g., 30 minutes)
  - Click "Generate Slots"
  - Slots should be created and visible

- [ ] **View Time Slots**
  - After creating slots, they should appear in the time slots list
  - Each slot shows date, time, and availability status

- [ ] **Delete Time Slot**
  - Click "Delete" on a time slot
  - Slot should be removed

#### Dashboard
- [ ] **View Provider Dashboard**
  - Go to: `/dashboard` (as provider)
  - Should see:
    - Profile photo or icon
    - Bio (with edit option)
    - Registered services count
    - Upcoming bookings
    - Portfolio summary
  - Pending bookings should be highlighted

- [ ] **Edit Bio**
  - Click "Edit Bio" on dashboard
  - Update bio text
  - Click "Save"
  - Bio should update immediately

#### Booking Management
- [ ] **View Bookings**
  - Go to: `/dashboard/bookings`
  - Should see all bookings with:
    - Customer name
    - Service name
    - Booking date/time
    - Status (pending, confirmed, etc.)

- [ ] **Accept Booking**
  - Click "Accept" on a pending booking
  - Status should change to "confirmed"
  - Booking should move to confirmed section

- [ ] **Reject Booking**
  - Click "Reject" on a pending booking
  - Status should change to "rejected"
  - Booking should be removed from active list

- [ ] **Cancel Booking**
  - Click "Cancel" on a confirmed booking
  - Status should change to "cancelled"

---

### 3. ✅ Customer Features

#### Browse Service Providers
- [ ] **View All Providers**
  - Go to: `/dashboard/providers` (as customer)
  - Should see list of all service providers
  - Each provider shows:
    - Profile photo or icon
    - Business name
    - City
    - Bio preview

- [ ] **Search Providers**
  - Use search bar to filter providers
  - Results should update in real-time

- [ ] **View Provider Details**
  - Click on a provider
  - Should see:
    - Full profile
    - Portfolio items (images/videos)
    - Services offered
    - "Book This Service" button for each service

#### Book Services
- [ ] **Select Service to Book**
  - From provider details page, click "Book This Service"
  - Should redirect to booking page with service details

- [ ] **View Available Time Slots**
  - On booking page, select a date
  - Available time slots should appear
  - Slots should be from provider's created time slots

- [ ] **Create Booking**
  - Select a date and time slot
  - Add optional notes
  - Click "Confirm Booking"
  - Should redirect to payment page
  - Booking should be created with status "pending"

#### Payment Flow
- [ ] **Payment Page**
  - After booking, should redirect to `/dashboard/payment`
  - Should show:
    - Service name
    - Amount
    - Payment form

- [ ] **Create Payment Intent**
  - Payment modal should open
  - Should call `/payments/create-intent`
  - Should receive `client_secret`
  - Card input should appear

- [ ] **Process Payment (Test Mode)**
  - Enter test card: `4242 4242 4242 4242`
  - Expiry: Any future date (e.g., 12/25)
  - CVC: Any 3 digits (e.g., 123)
  - ZIP: Any 5 digits (e.g., 12345)
  - Click "Pay"
  - Should process successfully
  - Should show success message
  - Booking payment status should update to "paid"

- [ ] **Payment Failure Test**
  - Use declined card: `4000 0000 0000 0002`
  - Should show error message
  - Payment should not complete

#### My Bookings
- [ ] **View My Bookings**
  - Go to: `/dashboard/my-bookings`
  - Should see all customer bookings with:
    - Provider name
    - Service name
    - Booking date/time
    - Status
    - Payment status

- [ ] **Pay Unpaid Booking**
  - For unpaid bookings, click "Pay Now"
  - Should redirect to payment page
  - Complete payment flow
  - Payment status should update

- [ ] **Cancel Booking**
  - Click "Cancel" on a booking
  - Booking status should change to "cancelled"

---

### 4. ✅ Payment System Testing

#### Test Cards (Stripe Test Mode)

**Success Cards:**
- `4242 4242 4242 4242` - Standard success
- `4000 0025 0000 3155` - Requires authentication (3D Secure)

**Failure Cards:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**Test Scenarios:**
- [ ] Successful payment
- [ ] Declined payment
- [ ] Payment with authentication required
- [ ] Payment confirmation
- [ ] Payment status updates in database

---

### 5. ✅ API Endpoint Testing

#### Using FastAPI Docs
1. Go to: `http://localhost:8000/docs`
2. Test endpoints interactively

#### Key Endpoints to Test:

**Authentication:**
- `POST /signup/customer`
- `POST /login/customer`
- `POST /signup/provider`
- `POST /login/provider`

**Provider Endpoints:**
- `GET /provider/dashboard`
- `GET /provider/portfolio`
- `POST /provider/portfolio`
- `PUT /provider/portfolio/{item_id}`
- `DELETE /provider/portfolio/{item_id}`
- `POST /provider/services`
- `PUT /provider/services/{service_id}`
- `DELETE /provider/services/{service_id}`
- `POST /provider/services/{service_id}/time-slots/bulk`
- `GET /provider/bookings`
- `PUT /provider/bookings/{booking_id}/status`

**Customer Endpoints:**
- `GET /providers` (all providers)
- `GET /providers/{provider_id}`
- `GET /services/{service_id}/available-slots`
- `POST /bookings`
- `GET /customer/bookings`
- `DELETE /customer/bookings/{booking_id}`

**Payment Endpoints:**
- `POST /payments/create-intent`
- `POST /payments/confirm`
- `GET /payments/{payment_id}`
- `POST /payments/webhook` (Stripe webhook)

---

### 6. ✅ Database Verification

#### Check Data in PostgreSQL

```sql
-- Connect to database
psql -U postgres -d glowsense_db

-- Check customers
SELECT id, email, full_name FROM customers;

-- Check service providers
SELECT id, email, business_name, city FROM service_providers;

-- Check services
SELECT id, name, price, provider_id FROM services;

-- Check time slots
SELECT id, service_id, slot_date, is_available FROM time_slots;

-- Check bookings
SELECT id, customer_id, provider_id, service_id, status, payment_status FROM bookings;

-- Check payments
SELECT id, booking_id, amount, status, stripe_payment_intent_id FROM payments;
```

---

### 7. ✅ Error Handling Tests

- [ ] **Invalid Login Credentials**
  - Try wrong password
  - Should show error message

- [ ] **Duplicate Email Signup**
  - Try signing up with existing email
  - Should show error

- [ ] **Booking Unavailable Slot**
  - Try booking a slot that's already booked
  - Should show error

- [ ] **Payment for Non-existent Booking**
  - Try accessing payment for invalid booking ID
  - Should show 404 error

- [ ] **Unauthorized Access**
  - Try accessing provider endpoints as customer
  - Should show 401/403 error

---

### 8. ✅ UI/UX Testing

- [ ] **Responsive Design**
  - Test on different screen sizes
  - Sidebar should work on mobile

- [ ] **Loading States**
  - Check loading indicators during API calls
  - No infinite loading

- [ ] **Error Messages**
  - Clear, user-friendly error messages
  - No technical jargon exposed

- [ ] **Navigation**
  - All links work correctly
  - Back button works
  - Breadcrumbs (if any) work

---

### 9. ✅ Performance Testing

- [ ] **Page Load Times**
  - Dashboard loads in < 2 seconds
  - Portfolio page loads in < 3 seconds

- [ ] **API Response Times**
  - Login completes in < 1 second
  - Booking creation in < 2 seconds
  - Payment intent creation in < 2 seconds

---

## 🐛 Common Issues & Solutions

### Issue: 404 on Payment Endpoints
**Solution:** Restart backend server after adding payment endpoints

### Issue: Stripe Payment Fails
**Solution:** 
- Check Stripe keys in `.env` files
- Ensure using test mode keys (`sk_test_` and `pk_test_`)
- Verify Stripe package is installed: `pip install stripe`

### Issue: Time Slots Not Showing
**Solution:**
- Check timezone settings
- Verify slots are created for the selected date
- Check database for time_slots entries

### Issue: Booking Status Not Updating
**Solution:**
- Check backend logs for errors
- Verify database connection
- Check booking ID exists

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Authentication: [ ] Pass [ ] Fail
Provider Features: [ ] Pass [ ] Fail
Customer Features: [ ] Pass [ ] Fail
Payment System: [ ] Pass [ ] Fail
API Endpoints: [ ] Pass [ ] Fail
Error Handling: [ ] Pass [ ] Fail

Issues Found:
1. _________________________
2. _________________________
3. _________________________

Notes:
_________________________
_________________________
```

---

## ✅ Success Criteria

All tests should pass:
- ✅ Users can signup/login (both roles)
- ✅ Providers can manage portfolio and services
- ✅ Providers can create time slots
- ✅ Customers can browse providers and services
- ✅ Customers can book services
- ✅ Payments process successfully
- ✅ Booking status updates correctly
- ✅ No console errors
- ✅ Database integrity maintained

---

## 🚀 Quick Test Commands

```bash
# Start backend
cd backend
uvicorn main:app --reload --port 8000

# Start frontend (new terminal)
cd glowsense-web
npm run dev

# Check database
psql -U postgres -d glowsense_db -c "SELECT COUNT(*) FROM bookings;"

# Test API endpoint
curl http://localhost:8000/
```

---

**Happy Testing! 🎉**

