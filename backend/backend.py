# backend.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

app = FastAPI()

static_dir = os.path.join(os.path.dirname(__file__), '../dist')

app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

API_KEY = "2310e340b45dfe6b4d8745df476e365f"

@app.get("/weather")
def get_weather(city: str):
    base_url = "http://api.openweathermap.org/data/2.5/weather?"
    complete_url = f"{base_url}q={city}&appid={API_KEY}&units=metric"
    response = requests.get(complete_url)
    data = response.json()

    if data["cod"] != "404":
        main_data = data["main"]
        weather_data = data["weather"][0]
        temperature = main_data["temp"]
        pressure = main_data["pressure"]
        humidity = main_data["humidity"]
        weather_description = weather_data["description"]

        weather_info = (
            f"Temperature: {temperature}°C\n"
            f"Humidity: {humidity}%\n"
            f"Pressure: {pressure} hPa\n"
            f"Condition: {weather_description}"
        )

        return {"weather": weather_info}

    else:
        raise HTTPException(status_code=404, detail="City not found")

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_react(full_path: str, request: Request):
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Page not found")