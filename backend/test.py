import requests

url = "http://127.0.0.1:8000/stream-audio"
params = {"weather": ""}

with requests.get(url, params=params, stream=True) as r:
    r.raise_for_status()
    with open("test_stream_output.mp3", "wb") as f:
        for chunk in r.iter_content(chunk_size=1024):
            if chunk:
                f.write(chunk)

print("Saved test_stream_output.mp3")
