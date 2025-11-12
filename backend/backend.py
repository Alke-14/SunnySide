# backend.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

# declare the FastAPI function
app = FastAPI()

# set the path to the static files (React build output)
static_dir = os.path.join(os.path.dirname(__file__), '../dist')

# setup CORS to process requrests from frontend
app.add_middleware(
    CORSMiddleware,
    # these are the origins used in development and production, it escapes CORS error handler;
    # otherwise, any requests we do through the field will be blocked and logged in the console from the browser (I found out the hard way :( )
    allow_origins=["http://localhost:5173", "https://sunnyside-91z4.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount the static files directory to serve React app in the assets directory (used to load essential files)
app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

API_KEY = "2310e340b45dfe6b4d8745df476e365f"

@app.get("/weather")
def get_weather(city: str):
    base_url = "http://api.openweathermap.org/data/2.5/weather?"
    complete_url = f"{base_url}q={city}&appid={API_KEY}&units=metric"
    response = requests.get(complete_url)
    data = response.json()

# if the data is found for the city, extract the specified information
    if data["cod"] != "404":
        main_data = data["main"]
        # extracting weather description and initialize the API response
        weather_data = data["weather"][0]
        # using the data from the response above, we extract the important information
        temperature = main_data["temp"]
        pressure = main_data["pressure"]
        humidity = main_data["humidity"]
        weather_description = weather_data["description"]
        
        # make it pretty for frontend to load properly on the container in the card  
        weather_info = (
            f"Temperature: {temperature}°C\n"
            f"Humidity: {humidity}%\n"
            f"Pressure: {pressure} hPa\n"
            f"Condition: {weather_description}"
        )

        return {"weather": weather_info}

    else:
        raise HTTPException(status_code=404, detail="City not found")

@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    # we tell the backend to load the contents into the index for anything that is not declared as an API route
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Page not found")