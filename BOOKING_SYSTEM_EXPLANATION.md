# Time Slot Booking System - Complete Explanation

## Database Structure

### 1. **`time_slots` Table (NEW)**
This table stores individual time slots that service providers create for their services.

**Structure:**
```sql
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    slot_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:**
- Each row represents a specific date and time slot for a service
- Providers can create slots in bulk (up to 3 months in advance)
- Slots can be marked as unavailable by the provider
- When a customer books a slot, it's linked via `time_slot_id` in the `bookings` table

**Indexes:**
- `idx_time_slots_service_id` - Fast lookup by service
- `idx_time_slots_slot_date` - Fast date range queries
- `idx_time_slots_available` - Fast filtering of available slots

### 2. **`bookings` Table (UPDATED)**
Stores customer bookings with reference to time slots.

**New Column:**
- `time_slot_id` (INTEGER, FOREIGN KEY, NULLABLE) - References `time_slots.id`

**Booking Flow:**
1. Customer selects an available time slot
2. Booking is created with `status = "pending"`
3. Provider reviews and can:
   - **Accept** → `status = "confirmed"`
   - **Reject** → `status = "rejected"`
   - **Cancel** → `status = "cancelled"`
   - **Complete** → `status = "completed"` (after service is done)

**Status Values:**
- `pending` - Waiting for provider approval (default for customer bookings)
- `confirmed` - Provider accepted the booking
- `rejected` - Provider rejected the booking
- `cancelled` - Booking was cancelled (by either party)
- `completed` - Service has been completed

### 3. **`services` Table (UNCHANGED)**
The `availability_schedule` column is kept for backward compatibility but the new system uses the `time_slots` table.

## How It Works

### Provider Side:

#### Creating Time Slots:
1. Go to **Portfolio/Services** page
2. Click **"Create Time Slots"** for a service
3. Fill in the form:
   - **Start Date** - When slots should start
   - **End Date** - When slots should end (max 3 months from start)
   - **Days of Week** - Select which days (Mon-Sun)
   - **Start Time** - e.g., 09:00
   - **End Time** - e.g., 17:00
   - **Interval** - Minutes between slots (e.g., 30 = slots at 9:00, 9:30, 10:00, etc.)
4. Click **"Create Time Slots"**
5. System generates individual slots for each date/time combination

**Example:**
- Start: 2024-01-01, End: 2024-03-31
- Days: Monday, Tuesday, Wednesday
- Time: 09:00 - 17:00
- Interval: 30 minutes
- **Result:** Creates slots like:
  - 2024-01-01 09:00
  - 2024-01-01 09:30
  - 2024-01-01 10:00
  - ... (for all Mondays, Tuesdays, Wednesdays until March 31)

#### Managing Bookings:
- View all bookings on **Bookings** page
- **Pending bookings** are highlighted in yellow
- Click **Accept** or **Reject** for pending bookings
- Dashboard shows pending count prominently

### Customer Side:

#### Booking a Service:
1. Browse service providers on **Service Providers** page
2. Click **"Book This Service"** for a service
3. Select a **date** (up to 3 months ahead)
4. System shows **available time slots** for that date
5. Select a **time slot**
6. Add optional **notes**
7. Click **"Confirm Booking"**
8. Booking is created with `status = "pending"`
9. Wait for provider to accept/reject

#### Viewing Bookings:
- Go to **My Bookings** page
- See all bookings with status:
  - **Pending** (yellow) - Waiting for approval
  - **Confirmed** (green) - Approved by provider
  - **Completed** (blue) - Service finished
  - **Cancelled/Rejected** (red) - Not happening

## Database Relationships

```
ServiceProvider (1) ──→ (many) Service
Service (1) ──→ (many) TimeSlot
TimeSlot (1) ──→ (1) Booking (one booking per slot)
Service (1) ──→ (many) Booking
Customer (1) ──→ (many) Booking
ServiceProvider (1) ──→ (many) Booking
```

## Key Features

1. **3-Month Limit:** Time slots can only be created up to 3 months in advance
2. **One Booking Per Slot:** Each time slot can only have one booking (enforced by checking existing bookings)
3. **Pending Approval:** All customer bookings start as "pending" and require provider approval
4. **Timezone Support:** All dates/times stored in UTC, converted to provider's timezone for display
5. **Bulk Creation:** Providers can create hundreds of slots at once with one form submission

## API Endpoints

### Provider Endpoints:
- `POST /provider/services/{service_id}/time-slots/bulk` - Create time slots in bulk
- `GET /provider/services/{service_id}/time-slots` - Get time slots for a service
- `PUT /provider/time-slots/{time_slot_id}` - Update a time slot (mark available/unavailable)
- `DELETE /provider/time-slots/{time_slot_id}` - Delete a time slot
- `PUT /provider/bookings/{booking_id}/status` - Accept/reject/cancel booking

### Customer Endpoints:
- `GET /services/{service_id}/available-slots?date={date}` - Get available slots for a date
- `POST /bookings` - Create booking from time slot (requires `time_slot_id`)
- `GET /customer/bookings` - Get customer's bookings

## Example Data Flow

### 1. Provider Creates Slots:
```json
POST /provider/services/1/time-slots/bulk
{
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-03-31T23:59:59Z",
  "days_of_week": [0, 1, 2, 3, 4],  // Mon-Fri
  "start_time": "09:00",
  "end_time": "17:00",
  "interval_minutes": 30
}
```
**Creates:** ~520 time slots (5 days/week × 16 slots/day × ~13 weeks)

### 2. Customer Views Available Slots:
```json
GET /services/1/available-slots?date=2024-01-15T00:00:00Z
```
**Returns:**
```json
{
  "service_id": 1,
  "date": "2024-01-15T00:00:00Z",
  "timezone": "Asia/Karachi",
  "available_slots": [
    {"id": 123, "slot_date": "2024-01-15T09:00:00+05:00", "time": "09:00"},
    {"id": 124, "slot_date": "2024-01-15T09:30:00+05:00", "time": "09:30"},
    ...
  ],
  "duration": "60 minutes"
}
```

### 3. Customer Books:
```json
POST /bookings
{
  "service_id": 1,
  "time_slot_id": 123,
  "notes": "First time client"
}
```
**Creates booking:**
- `status = "pending"`
- `time_slot_id = 123`
- `booking_date = 2024-01-15T09:00:00Z`

### 4. Provider Accepts:
```json
PUT /provider/bookings/456/status
{
  "status": "confirmed"
}
```
**Updates booking:**
- `status = "confirmed"`
- Sends notification to customer
- Creates Google Calendar event (if configured)

## Dashboard Updates

### Provider Dashboard:
- **Pending Bookings Card:** Highlighted in yellow, clickable, shows count
- **Recent Bookings:** Pending bookings shown first with yellow border
- **Quick Action:** "Review Booking" button for pending items

### Customer Dashboard:
- **My Bookings Page:** Shows all bookings with status badges
- **Filter Tabs:** Filter by status (all, pending, confirmed, completed, cancelled)
- **Status Colors:**
  - Pending: Yellow
  - Confirmed: Green
  - Completed: Blue
  - Cancelled/Rejected: Red

## Migration Applied

The migration script (`create_time_slots_table.py`) has been executed and:
✅ Created `time_slots` table
✅ Added `time_slot_id` column to `bookings` table
✅ Created indexes for optimal performance

## Next Steps for Testing

1. **Provider:** Create time slots for a service (up to 3 months)
2. **Customer:** Browse providers and book a service
3. **Provider:** Check dashboard for pending bookings
4. **Provider:** Accept/reject the booking
5. **Customer:** Check booking status on "My Bookings" page

The system is now fully functional with the new time slot-based booking system!

