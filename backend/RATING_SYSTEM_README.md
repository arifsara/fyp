# Rating System Module

Complete rating system for customers to rate service providers after service completion.

## 📁 Module Structure

```
backend/
├── ratings/
│   ├── __init__.py
│   └── routes.py          # Rating API endpoints
└── models.py              # Rating model (already exists)

glowsense-web/src/
├── components/
│   └── rating/
│       ├── RatingModal.tsx      # Modal for customers to submit ratings
│       └── RatingDisplay.tsx     # Component to display star ratings
└── app/
    └── dashboard/
        ├── ratings/
        │   └── page.tsx          # Provider ratings view page
        └── my-bookings/
            └── page.tsx          # Updated with rating button
```

## 🎯 Features

### Customer Features:
- ✅ Rate completed bookings (1-5 stars)
- ✅ Add optional comments/feedback
- ✅ View average ratings for providers
- ✅ See rating status on completed bookings

### Provider Features:
- ✅ View all ratings received
- ✅ See average rating and total count
- ✅ View individual ratings with customer names and comments
- ✅ Dedicated ratings page in dashboard

## 📡 API Endpoints

### Customer Endpoints

#### `POST /ratings/create`
Create a rating for a completed booking.

**Request:**
```json
{
  "booking_id": 1,
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Response:**
```json
{
  "id": 1,
  "booking_id": 1,
  "customer_id": 1,
  "provider_id": 2,
  "service_id": 3,
  "rating": 5,
  "comment": "Excellent service!",
  "created_at": "2024-01-01T12:00:00Z",
  "customer_name": "John Doe",
  "service_name": "Haircut"
}
```

#### `GET /ratings/provider/{provider_id}/average`
Get average rating for a provider (public endpoint).

**Response:**
```json
{
  "provider_id": 2,
  "average_rating": 4.5,
  "total_ratings": 10
}
```

#### `GET /ratings/booking/{booking_id}/check`
Check if a booking has been rated.

**Response:**
```json
{
  "booking_id": 1,
  "is_rated": true,
  "can_rate": false,
  "rating": {
    "id": 1,
    "rating": 5,
    "comment": "Excellent!",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

#### `GET /ratings/customer/my-ratings`
Get all ratings given by the current customer.

### Provider Endpoints

#### `GET /ratings/provider/my-ratings`
Get all ratings received by the current provider.

**Response:**
```json
{
  "provider_id": 2,
  "average_rating": 4.5,
  "total_ratings": 10,
  "ratings": [
    {
      "id": 1,
      "booking_id": 1,
      "customer_id": 1,
      "provider_id": 2,
      "service_id": 3,
      "rating": 5,
      "comment": "Excellent service!",
      "created_at": "2024-01-01T12:00:00Z",
      "customer_name": "John Doe",
      "service_name": "Haircut"
    }
  ]
}
```

## 🔧 Database Schema

The `Rating` model already exists in `models.py`:

```python
class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

## 🎨 Frontend Components

### RatingModal
Modal component for customers to submit ratings.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `bookingId: number`
- `serviceName: string`
- `providerName: string`
- `onSuccess: () => void`

### RatingDisplay
Component to display star ratings.

**Props:**
- `rating: number` - Rating value (0-5)
- `totalRatings?: number` - Total number of ratings
- `showTotal?: boolean` - Show total count
- `size?: "sm" | "md" | "lg"` - Size of stars

## 📱 User Flows

### Customer Flow:
1. Customer completes a booking
2. Provider marks booking as "completed"
3. Customer sees "Rate This Service" button in My Bookings
4. Customer clicks button → Rating modal opens
5. Customer selects stars (1-5) and optionally adds comment
6. Rating is saved
7. Button changes to "You've already rated this service"

### Provider Flow:
1. Provider navigates to "Ratings" in dashboard
2. Sees overall average rating and total count
3. Views list of all individual ratings
4. Each rating shows:
   - Star rating
   - Customer name
   - Service name
   - Comment (if provided)
   - Date

## ✅ Integration Points

### My Bookings Page
- Shows "Rate This Service" button for completed bookings
- Checks rating status on load
- Displays "Already rated" message if rated

### Providers Listing Page
- Fetches average ratings for all providers
- Displays star rating and total count on provider cards
- Shows rating in provider detail view

### Provider Dashboard
- Added "Ratings" link in sidebar
- Dedicated ratings page shows all received ratings

## 🚀 Setup

1. **Backend routes are already integrated** in `main.py`
2. **Frontend components are ready** in `components/rating/`
3. **Pages are created** in `app/dashboard/ratings/`

## 🧪 Testing

### Test Rating Creation:
```bash
curl -X POST "http://localhost:8000/ratings/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "booking_id": 1,
    "rating": 5,
    "comment": "Great service!"
  }'
```

### Test Provider Ratings:
```bash
curl -X GET "http://localhost:8000/ratings/provider/my-ratings" \
  -H "Authorization: Bearer PROVIDER_TOKEN"
```

## 📝 Notes

- Ratings can only be created for bookings with status "completed"
- Each booking can only be rated once
- Rating value must be between 1 and 5
- Comments are optional (max 500 characters)
- Average ratings are calculated automatically
- Ratings are displayed in provider listings

---

**Rating system is ready to use!** ⭐

