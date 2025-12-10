from pydantic import BaseModel
from typing import List

class TripBase(BaseModel):
    destination: str
    days: int
    budget: int
    activities: List[str]
    weather: str
    restaurants: List[str]
    hotel: str
    estimated_cost: int

class TripCreate(TripBase):
    pass

class TripOut(TripBase):
    id: int

    class Config:
        from_attributes = True
