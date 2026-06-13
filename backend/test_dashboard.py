from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import auth

# Create a test client
client = TestClient(app, raise_server_exceptions=True)

# Find user
db = SessionLocal()
customer = db.query(models.Customer).filter(models.Customer.email == 'testuser10@example.com').first()
if customer:
    token = auth.create_access_token(data={"sub": customer.email, "role": "customer", "customer_id": customer.id})
    try:
        response = client.get("/customer/dashboard", headers={"Authorization": f"Bearer {token}"})
        print("Status:", response.status_code)
        print("Body:", response.json())
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("Customer not found")
