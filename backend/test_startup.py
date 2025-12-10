"""Quick test to see what's blocking backend startup"""
import time
import sys

print("Testing backend startup components...\n")

# Test 1: Basic imports
start = time.time()
try:
    print("1. Testing basic imports...")
    from fastapi import FastAPI
    from sqlalchemy import create_engine
    print(f"   ✅ Basic imports: {time.time() - start:.2f}s")
except Exception as e:
    print(f"   ❌ Import failed: {e}")
    sys.exit(1)

# Test 2: Database connection
start = time.time()
try:
    print("2. Testing database connection...")
    from dotenv import load_dotenv
    import os
    load_dotenv()
    
    from database import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"   ✅ Database connection: {time.time() - start:.2f}s")
except Exception as e:
    print(f"   ❌ Database connection failed: {e}")
    print(f"   Time taken: {time.time() - start:.2f}s")

# Test 3: Models import
start = time.time()
try:
    print("3. Testing models import...")
    import models
    print(f"   ✅ Models import: {time.time() - start:.2f}s")
except Exception as e:
    print(f"   ❌ Models import failed: {e}")
    print(f"   Time taken: {time.time() - start:.2f}s")

# Test 4: Stripe import
start = time.time()
try:
    print("4. Testing Stripe import...")
    import stripe
    print(f"   ✅ Stripe import: {time.time() - start:.2f}s")
except Exception as e:
    print(f"   ⚠️ Stripe import failed (optional): {e}")
    print(f"   Time taken: {time.time() - start:.2f}s")

# Test 5: APScheduler import
start = time.time()
try:
    print("5. Testing APScheduler import...")
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    print(f"   ✅ APScheduler import: {time.time() - start:.2f}s")
except Exception as e:
    print(f"   ⚠️ APScheduler import failed (optional): {e}")
    print(f"   Time taken: {time.time() - start:.2f}s")

print("\n✅ Startup test complete!")

