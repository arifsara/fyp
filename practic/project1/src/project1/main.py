from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from db import get_db, engine
from models import Base
import schemas, services
from agent_logic import run_trip_agent
from schemas import TripCreate, TripOut

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic (if any)

app = FastAPI(lifespan=lifespan)


@app.post("/plan", response_model=TripOut)
def plan_trip(query: str, db: Session = Depends(get_db)):
    agent_output = run_trip_agent(query)

    if hasattr(agent_output, "dict"):
        agent_output = agent_output.dict()

    # Ensure activities/restaurants are lists
    agent_output["activities"] = (
        agent_output["activities"]
        if isinstance(agent_output["activities"], list)
        else agent_output["activities"].split(", ")
    )
    agent_output["restaurants"] = (
        agent_output["restaurants"]
        if isinstance(agent_output["restaurants"], list)
        else agent_output["restaurants"].split(", ")
    )

    trip_create = TripCreate(**agent_output)
    return services.create_trip(db, trip_create)


@app.get("/trips", response_model=list[TripOut])
def read_trips(db: Session = Depends(get_db)):
    return services.get_all_trips(db)


@app.get("/trips/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = services.get_trip(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@app.delete("/trips/{trip_id}", response_model=TripOut)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = services.delete_trip(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip
