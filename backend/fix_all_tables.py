from sqlalchemy import text
from database import engine

def add_columns():
    # service_providers table
    sp_columns = [
        ("level", "VARCHAR DEFAULT 'beginner'"),
        ("stripe_account_id", "VARCHAR"),
        ("stripe_onboarding_complete", "BOOLEAN DEFAULT FALSE"),
        # skip embedding
    ]

    for col_name, col_type in sp_columns:
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE service_providers ADD COLUMN {col_name} {col_type};"))
            print(f"Added {col_name} to service_providers")
        except Exception as e:
            print(f"Skipped {col_name} for service_providers: might already exist. Error: {e}")

    # bookings table
    bookings_columns = [
        ("booking_status", "VARCHAR"),
        ("stripe_payment_intent_id", "VARCHAR"),
        ("stripe_charge_id", "VARCHAR"),
        ("stripe_transfer_id", "VARCHAR"),
        ("stripe_refund_id", "VARCHAR"),
        ("original_provider_id", "INTEGER"),
        ("assigned_provider_id", "INTEGER")
    ]

    for col_name, col_type in bookings_columns:
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type};"))
            print(f"Added {col_name} to bookings")
        except Exception as e:
            print(f"Skipped {col_name} for bookings: might already exist. Error: {e}")

if __name__ == "__main__":
    add_columns()
