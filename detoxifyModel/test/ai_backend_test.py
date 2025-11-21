import requests

url = 'http://127.0.0.1:8000/analyze'

data = {
    "text": "You are a badword!"  # Example input
}

response = requests.post(url, json=data)

# Print response status and data
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
