# Provider Level System

## Overview

The Provider Level System automatically assigns levels to service providers based on their average ratings. This helps customers identify experienced and highly-rated providers.

## Levels

### 🌱 Beginner (Default)
- **Rating Range**: 0.0 - 2.99
- **Color**: Gray
- **Icon**: 🌱
- **Description**: New providers start at this level

### ⭐ Skilled
- **Rating Range**: 3.0 - 3.99
- **Color**: Blue
- **Icon**: ⭐
- **Description**: Providers with good ratings (3.0+)

### 👑 Expert
- **Rating Range**: 4.0 - 5.0
- **Color**: Purple
- **Icon**: 👑
- **Description**: Top-rated providers (4.0+)

## How It Works

1. **New Provider Signup**: All new providers start at "Beginner" level
2. **Automatic Updates**: When a customer submits a rating, the provider's level is automatically recalculated
3. **Level Calculation**: Based on average rating across all ratings
   - Average >= 4.0 → Expert
   - Average >= 3.0 → Skilled
   - Average < 3.0 → Beginner

## Database Schema

### ServiceProvider Model
```python
level = Column(String, default="beginner")  # beginner, skilled, expert
```

## API Endpoints

All provider endpoints now include level information:

- `GET /providers` - Returns all providers with level info
- `GET /providers/{provider_id}` - Returns provider details with level
- `GET /provider/profile` - Returns provider's own profile with level
- `GET /provider/dashboard` - Returns dashboard data with level

## Frontend Display

### Provider Level Badge Component
Located at: `glowsense-web/src/components/rating/ProviderLevelBadge.tsx`

**Usage:**
```tsx
import ProviderLevelBadge from "@/components/rating/ProviderLevelBadge";

<ProviderLevelBadge 
  level={provider.level} 
  levelInfo={provider.level_info}
  size="md"  // sm, md, lg
/>
```

### Where Levels Are Displayed

1. **Provider Dashboard** (`/dashboard`)
   - Shows provider's own level badge next to welcome message

2. **Provider Listings** (`/dashboard/providers`)
   - Shows level badge on each provider card
   - Shows level badge on provider detail page

3. **Provider Profile** (when viewing provider details)
   - Shows level badge prominently in header

## Migration

To add the level column to existing databases:

```bash
cd backend
python migrations/add_provider_level.py
```

This script will:
1. Add the `level` column to `service_providers` table (if it doesn't exist)
2. Calculate and update levels for all existing providers based on their current ratings

## Service Functions

### ProviderLevelService

Located at: `backend/services/provider_level_service.py`

**Key Methods:**

- `calculate_level(average_rating: float) -> str`
  - Calculates level based on average rating

- `get_provider_average_rating(provider_id: int, db: Session) -> float`
  - Gets average rating for a provider

- `update_provider_level(provider_id: int, db: Session) -> Optional[str]`
  - Updates provider level based on current ratings

- `get_level_info(level: str) -> dict`
  - Returns level information (name, color, icon)

## Automatic Updates

Levels are automatically updated when:
- A new rating is submitted (`POST /ratings/`)
- The rating system calls `ProviderLevelService.update_provider_level()`

## Testing

To test the leveling system:

1. Create a new provider (should start as "Beginner")
2. Submit ratings to reach different thresholds:
   - Submit ratings averaging 3.0+ → Should become "Skilled"
   - Submit ratings averaging 4.0+ → Should become "Expert"
3. Check provider profile to see level badge

## Notes

- Levels are recalculated automatically when ratings change
- The system uses average rating, not total number of ratings
- New providers without ratings remain at "Beginner" level
- Level updates happen synchronously when ratings are created (may add slight delay)

