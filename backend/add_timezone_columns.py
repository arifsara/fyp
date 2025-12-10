"""
Migration script to add timezone and Google Calendar columns to service_providers table
and end_date, google_calendar_event_id, reminder_sent to bookings table
"""
from sqlalchemy import text, inspect
from database import engine

def add_booking_columns():
    """Add missing columns for booking system"""
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        # Get existing columns
        provider_columns = [col['name'] for col in inspector.get_columns('service_providers')]
        booking_columns = [col['name'] for col in inspector.get_columns('bookings')]
        
        # Add timezone and Google Calendar columns to service_providers
        provider_columns_to_add = {
            'timezone': 'VARCHAR DEFAULT \'UTC\'',
            'google_calendar_id': 'VARCHAR',
            'google_calendar_access_token': 'TEXT',
            'google_calendar_refresh_token': 'TEXT'
        }
        
        for col_name, col_def in provider_columns_to_add.items():
            if col_name not in provider_columns:
                try:
                    conn.execute(text(f"ALTER TABLE service_providers ADD COLUMN {col_name} {col_def};"))
                    print(f"✅ Added column: {col_name} to service_providers")
                except Exception as e:
                    print(f"⚠️ Error adding {col_name}: {e}")
        
        # Add booking columns
        booking_columns_to_add = {
            'end_date': 'TIMESTAMP WITH TIME ZONE',
            'google_calendar_event_id': 'VARCHAR',
            'reminder_sent': 'BOOLEAN DEFAULT FALSE'
        }
        
        for col_name, col_def in booking_columns_to_add.items():
            if col_name not in booking_columns:
                try:
                    conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def};"))
                    print(f"✅ Added column: {col_name} to bookings")
                except Exception as e:
                    print(f"⚠️ Error adding {col_name}: {e}")
        
        print("\n🎉 Migration completed!")

if __name__ == "__main__":
    add_booking_columns()

