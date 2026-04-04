import requests

url = "http://localhost:8000/rag/chat"

# msg 1
res1 = requests.post(url, json={
    "user_id": 11,
    "session_id": None,
    "message": "Hi, my name is Alex and I need a hair stylist."
}).json()

print(f"Res 1 Session: {res1.get('session_id')}")
print(f"Res 1 Text: {res1.get('response')}")

# msg 2
res2 = requests.post(url, json={
    "user_id": 11,
    "session_id": res1.get('session_id'),
    "message": "What did I just say my name was?"
}).json()

print(f"Res 2 Session: {res2.get('session_id')}")
print(f"Res 2 Text: {res2.get('response')}")
