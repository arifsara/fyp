# Database Structure for Time Slot Booking System

## Overview
This document explains the database structure for the new time slot-based booking system where service providers can add individual time slots (up to 3 months in advance) and customers can book from those available slots.

## Database Tables

### 1. `time_slots` Table (NEW)
Stores individual time slots that providers create for their services.

**Columns:**
- `id` (INTEGER, PRIMARY KEY): Unique identifier for each time slot
- `service_id` (INTEGER, FOREIGN KEY): References `services.id` - which service this slot belongs to
- `slot_date` (TIMESTAMP WITH TIME ZONE): The exact date and time of the slot
- `is_available` (BOOLEAN): Whether the slot is available for booking (can be marked unavailable by provider)
- `created_at` (TIMESTAMP WITH TIME ZONE): When the slot was created

**Indexes:**
- `idx_time_slots_service_id`: Index on `service_id` for fast lookups
- `idx_time_slots_slot_date`: Index on `slot_date` for date range queries
- `idx_time_slots_available`: Partial index on `is_available` where `is_available = TRUE`

**Relationships:**
- One `Service` can have many `TimeSlot`s
- One `TimeSlot` can have one `Booking` (one-to-one relationship)

### 2. `bookings` Table (UPDATED)
Stores customer bookings. Now includes reference to time slots.

**New Column:**
- `time_slot_id` (INTEGER, FOREIGN KEY, NULLABLE): References `time_slots.id` - the specific time slot booked
  - Added for backward compatibility (nullable)
  - When a booking is made from a time slot, this field is populated

**Existing Columns:**
- `id` (INTEGER, PRIMARY KEY)
- `customer_id` (INTEGER, FOREIGN KEY): References `customers.id`
- `provider_id` (INTEGER, FOREIGN KEY): References `service_providers.id`
- `service_id` (INTEGER, FOREIGN KEY): References `services.id`
- `booking_date` (TIMESTAMP WITH TIME ZONE): Kept for backward compatibility
- `end_date` (TIMESTAMP WITH TIME ZONE): Calculated from service duration
- `status` (STRING): `pending`, `confirmed`, `completed`, `cancelled`, `rejected`
- `notes` (TEXT): Optional notes
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `google_calendar_event_id` (STRING): For Google Calendar integration
- `reminder_sent` (BOOLEAN): Notification tracking

**New Index:**
- `idx_bookings_time_slot_id`: Index on `time_slot_id` for fast lookups

**Booking Flow:**
1. Customer selects an available time slot
2. Booking is created with `status = "pending"`
3. Provider can `accept` (status → "confirmed"), `reject` (status → "rejected"), or `cancel` (status → "cancelled")

### 3. `services` Table (UNCHANGED)
Stores service information.

**Note:** The `availability_schedule` (JSON) column is kept for backward compatibility but the new system uses the `time_slots` table instead.

## How the System Works

### Provider Side:
1. **Create Time Slots:**
   - Provider goes to Portfolio/Services page
   - Clicks "Manage Time Slots" for a service
   - Can create slots in bulk:
     - Select date range (up to 3 months)
     - Select days of week (Monday-Sunday)
     - Set start time, end time, and interval (e.g., every 30 minutes)
   - System generates individual time slots for each date/time combination

2. **Manage Bookings:**
   - Provider sees all bookings on Bookings page
   - Pending bookings show "Accept" and "Reject" buttons
   - Confirmed bookings can be marked "Completed" or "Cancelled"

### Customer Side:
1. **View Available Slots:**
   - Customer browses service providers
   - Selects a service
   - Chooses a date
   - System shows all available time slots for that date
   - Only shows slots that:
     - Are marked as `is_available = TRUE`
     - Don't have existing bookings with status "pending" or "confirmed"

2. **Make Booking:**
   - Customer selects a time slot
   - Booking is created with `status = "pending"`
   - Customer waits for provider approval
   - Customer dashboard shows booking status

## Database Migration

To apply these changes, run:
```bash
cd backend
python create_time_slots_table.py
```

This script will:
1. Create the `time_slots` table
2. Add `time_slot_id` column to `bookings` table
3. Create necessary indexes for performance

## Key Features

1. **3-Month Limit:** Time slots can only be created up to 3 months in advance
2. **One Booking Per Slot:** Each time slot can only have one booking (enforced by checking existing bookings)
3. **Pending Approval:** All customer bookings start as "pending" and require provider approval
4. **Timezone Support:** All dates/times are stored in UTC and converted to provider's timezone for display
5. **Backward Compatibility:** Old `availability_schedule` system still works alongside new time slots system

## API Endpoints

### Provider Endpoints:
- `POST /provider/services/{service_id}/time-slots/bulk` - Create time slots in bulk
- `GET /provider/services/{service_id}/time-slots` - Get time slots for a service
- `PUT /provider/time-slots/{time_slot_id}` - Update a time slot
- `DELETE /provider/time-slots/{time_slot_id}` - Delete a time slot
- `PUT /provider/bookings/{booking_id}/status` - Accept/reject/cancel booking

### Customer Endpoints:
- `GET /services/{service_id}/available-slots?date={date}` - Get available slots for a date
- `POST /bookings` - Create booking from time slot (requires `time_slot_id`)
- `GET /customer/bookings` - Get customer's bookings

## Example Data Flow

1. **Provider creates slots:**
   ```
   POST /provider/services/1/time-slots/bulk
   {
     "start_date": "2024-01-01T00:00:00Z",
     "end_date": "2024-03-31T23:59:59Z",
     "days_of_week": [0, 1, 2, 3, 4],  // Monday-Friday
     "start_time": "09:00",
     "end_time": "17:00",
     "interval_minutes": 30
   }
   ```
   Creates slots: 2024-01-01 09:00, 09:30, 10:00, ... 16:30 (for each weekday)

2. **Customer views available slots:**
   ```
   GET /services/1/available-slots?date=2024-01-15T00:00:00Z
   ```
   Returns all available slots for January 15, 2024

3. **Customer books:**
   ```
   POST /bookings
   {
     "service_id": 1,
     "time_slot_id": 123,
     "notes": "First time client"
   }
   ```
   Creates booking with `status = "pending"`

4. **Provider accepts:**
   ```
   PUT /provider/bookings/456/status
   {
     "status": "confirmed"
   }
   ```
   Updates booking status to "confirmed"

