from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

# SECRET KEY
SECRET_KEY = "supersecretkey_change_this_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# SWITCHED TO ARGON2 (No 72 byte limit, more secure)
# Optimized for faster verification while maintaining security
# time_cost=2: Faster verification (default is 3, higher = slower but more secure)
# memory_cost=65536: 64MB memory (default is 65536, good balance)
# parallelism=1: Single thread (default is 1, increase for multi-core but uses more memory)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__time_cost=2,  # Reduced from default 3 for faster login
    argon2__memory_cost=65536,  # 64MB (default, good balance)
    argon2__parallelism=1  # Single thread
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
