import requests

url = "http://localhost:8000/products/21/images?is_main=true"
headers = {"Authorization": "Bearer fake_token_just_to_see_auth"}
files = {"file": ("test.png", b"fake_image_data", "image/png")}

try:
    response = requests.post(url, headers=headers, files=files)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
