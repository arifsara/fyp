"""
Migration: Add Stripe Connect + Standby columns and standby_offers table.

Run from backend dir: python migrations/add_stripe_connect_and_standby.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text


def column_exists(db, table: str, column: str) -> bool:
    result = db.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = :t AND column_name = :c
    """), {"t": table, "c": column})
    return result.fetchone() is not None


def table_exists(db, table: str) -> bool:
    result = db.execute(text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = :t
    """), {"t": table})
    return result.fetchone() is not None


def migrate():
    with engine.connect() as conn:
        db = conn
        trans = conn.begin()

        try:
            # --- service_providers: Stripe Connect ---
            if not column_exists(db, "service_providers", "stripe_account_id"):
                print("Adding stripe_account_id to service_providers...")
                db.execute(text("ALTER TABLE service_providers ADD COLUMN stripe_account_id VARCHAR"))
                print("  Done.")
            else:
                print("stripe_account_id already exists.")

            if not column_exists(db, "service_providers", "stripe_onboarding_complete"):
                print("Adding stripe_onboarding_complete to service_providers...")
                db.execute(text("ALTER TABLE service_providers ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE"))
                print("  Done.")
            else:
                print("stripe_onboarding_complete already exists.")

            # --- bookings: new columns ---
            for col, dtype in [
                ("booking_status", "VARCHAR"),
                ("stripe_payment_intent_id", "VARCHAR"),
                ("stripe_charge_id", "VARCHAR"),
                ("stripe_transfer_id", "VARCHAR"),
                ("stripe_refund_id", "VARCHAR"),
                ("original_provider_id", "INTEGER REFERENCES service_providers(id)"),
                ("assigned_provider_id", "INTEGER REFERENCES service_providers(id)"),
                ("standby_offer_status", "VARCHAR"),
            ]:
                if not column_exists(db, "bookings", col):
                    print(f"Adding {col} to bookings...")
                    db.execute(text(f"ALTER TABLE bookings ADD COLUMN {col} {dtype}"))
                    print(f"  Done.")
                else:
                    print(f"{col} already exists on bookings.")

            # Update payment_status default if column exists (Postgres keeps existing rows; new default only for new rows)
            if column_exists(db, "bookings", "payment_status"):
                # Ensure we can store UNPAID etc; no need to alter default for existing data
                print("payment_status column exists (no change).")

            # --- standby_offers table ---
            if not table_exists(db, "standby_offers"):
                print("Creating standby_offers table...")
                db.execute(text("""
                    CREATE TABLE standby_offers (
                        id SERIAL PRIMARY KEY,
                        booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
                        offered_providers TEXT,
                        accepted_provider_id INTEGER REFERENCES service_providers(id),
                        status VARCHAR DEFAULT 'PENDING',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                """))
                db.execute(text("CREATE INDEX IF NOT EXISTS ix_standby_offers_booking_id ON standby_offers(booking_id)"))
                print("  Done.")
            else:
                print("standby_offers table already exists.")

            trans.commit()
            print("\nMigration completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"\nMigration failed: {e}")
            raise


if __name__ == "__main__":
    migrate()
