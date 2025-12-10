from sqlalchemy.orm import Session
from models import Trip
from schemas import TripCreate

def create_trip(db: Session, trip: TripCreate):
    db_trip = Trip(**trip.dict())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

def get_all_trips(db: Session):
    return db.query(Trip).all()

def get_trip(db: Session, trip_id: int):
    return db.query(Trip).filter(Trip.id == trip_id).first()

def delete_trip(db: Session, trip_id: int):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip:
        db.delete(trip)
        db.commit()
    return trip
