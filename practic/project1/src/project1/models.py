from sqlalchemy import Column, Integer, String, Text
from db import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    destination = Column(String)
    days = Column(Integer)
    budget = Column(Integer)
    activities = Column(Text)
    weather = Column(String)
    restaurants = Column(Text)
    hotel = Column(String)
    estimated_cost = Column(Integer)
