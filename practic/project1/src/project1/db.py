from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password@localhost:5432/travel_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
sessionlocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
 
def get_db():
    db = sessionlocal()
    try:
        yield db
    finally:
        db.close()
        
def create_table():
    Base.metadata.create_all(bind=engine)
