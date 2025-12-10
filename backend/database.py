from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv

load_dotenv()

# Format: postgresql://username:password@localhost:port/dbname
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:18220@localhost:5432/glowsense_db")

# Optimized engine with connection pooling for faster queries
# Added connect_args with timeout to prevent hanging
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections if pool is exhausted
    pool_pre_ping=True,  # Verify connections before using them
    echo=False,  # Set to True for SQL query logging (useful for debugging)
    connect_args={
        "connect_timeout": 5,  # 5 second timeout for connection attempts
        "options": "-c statement_timeout=5000"  # 5 second timeout for queries
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
