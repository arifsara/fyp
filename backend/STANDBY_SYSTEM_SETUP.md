# Standby Support System - Setup Instructions

## ⚠️ Important: Models.py Restoration

The `models.py` file was accidentally overwritten during development. Before using the standby system, you need to:

1. **Restore your original `models.py` file** from your backup or version control
2. **Add the standby models** by either:
   - Importing from `standby_models.py`: Add `from standby_models import StandbyQueue, StandbyNotification, StandbyRequest` to `models.py`
   - Or copy the three model classes from `standby_models.py` to the end of `models.py`

## Database Migration

Run the migration script to create the standby tables:

```bash
cd backend
python migrations/create_standby_tables.py
```

## Features

1. **Standby Queue**: System maintains a queue of providers with free slots
2. **Provider Notifications**: Providers receive popups when added to standby (shown for 5 days)
3. **Customer Standby Support**: When a booking is cancelled, customers can see available standby providers
4. **Automatic Matching**: System finds providers available for the cancelled booking slot

