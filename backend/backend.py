# backend.py
from xmlrpc import client
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import httpx
import requests
import os
from fastapi import Request
from google import genai
from google.genai import types
import re
from elevenlabs.client import ElevenLabs # Updated import
from elevenlabs import VoiceSettings


def sanitize_for_tts(text: str) -> str:
    # Remove non-ASCII temporarily (just for debugging)
    text = text.encode("ascii", "ignore").decode()

    # Flatten whitespace
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)

    # Optional: truncate super long responses
    max_len = 500  # chars
    if len(text) > max_len:
        text = text[:max_len]

    return text.strip()
# declare the FastAPI function
app = FastAPI()

# set the path to the static files (React build output)
# static_dir = os.path.join(os.path.dirname(__file__), '../dist')

# setup CORS to process requrests from frontend
app.add_middleware(
    CORSMiddleware,
    # these are the origins used in development and production, it escapes CORS error handler;
    # otherwise, any requests we do through the field will be blocked and logged in the console from the browser (I found out the hard way :( )
    allow_origins=["http://localhost:5173", "http://localhost:8000" "https://sunnyside-91z4.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount the static files directory to serve React app in the assets directory (used to load essential files)
# app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    raise EnvironmentError("ELEVENLABS_API_KEY not found in environment variables.")

# This is a common voice ID for "Rachel". Replace with your preferred voice.
VOICE_ID = "JBFqnCBsd6RMkjVDRZzb" 
API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"

# async def stream_from_elevenlabs(text: str):
#     headers = {
#         "Accept": "audio/mpeg",
#         "xi-api-key": ELEVENLABS_API_KEY,
#         "content-type": "application/json"
#     }

#     data = {
#         "text": text,
#         "voice_settings": {
#             "stability": 0.5,
#             "similarity_boost": 0.75
#         }
#     }

#     async with httpx.AsyncClient(timeout=None) as client:
#         try:
#             async with client.stream("POST", API_URL, headers=headers, json=data) as response:
#                 if response.status_code != 200:
#                     raise HTTPException(status_code=response.status_code, detail="Error from ElevenLabs API")

#                 async for chunk in response.aiter_bytes():
#                     yield chunk
#         except httpx.RequestError as e:
#             raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

def get_brainrot(weather: str):
    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"You are a brainrot gen-z weatherman. Tell abt the city's weather today using brainrot/tiktok terms like cooked, chopped, bombaclot and more. Don't use emojis or format with Markdown: {weather}",
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0),  # Disables thinking
            max_output_tokens=300,
        )
    )
    print(response.text)
    return response.text

@app.get("/stream-audio")
async def get_tts_stream(weather: str = ""):
    print("input", weather)
    """
    This endpoint generates audio from a fixed text string and streams it back
    as an 'audio/mpeg' response.
    """

    # 0. Initialize the ElevenLabs client
    client = ElevenLabs(
    api_key=ELEVENLABS_API_KEY,
)
        
    # 2. Define voice settings (optional, but good for consistency)
    # You can get voice IDs from your ElevenLabs account
    voice_id = "pNInz6obpgDQGcFmaJgB" # A popular default voice
    
    # 3. Call the ElevenLabs client.text_to_speech.stream function
    # This returns a generator that yields audio chunks.
    audio_stream = client.text_to_speech.stream(
        output_format="mp3_22050_32",
        text=get_brainrot(weather),
        voice_id=voice_id,
        model_id="eleven_flash_v2_5", # Use model_id as per new client
        voice_settings=VoiceSettings(stability=0.5, similarity_boost=0.75)
    )
    
    # 4. Return a StreamingResponse
    # This sends the audio chunks to the client as they are received.
    return StreamingResponse(audio_stream, media_type="audio/mpeg")
# API_KEY = "2310e340b45dfe6b4d8745df476e365f"

# @app.get("/weather")
# def get_weather(city: str):
#     base_url = "http://api.openweathermap.org/data/2.5/weather?"
#     complete_url = f"{base_url}q={city}&appid={API_KEY}&units=metric"
#     response = requests.get(complete_url)
#     data = response.json()

# # if the data is found for the city, extract the specified information
#     if data["cod"] != "404":
#         main_data = data["main"]
#         # extracting weather description and initialize the API response
#         weather_data = data["weather"][0]
#         # using the data from the response above, we extract the important information
#         temperature = main_data["temp"]
#         pressure = main_data["pressure"]
#         humidity = main_data["humidity"]
#         weather_description = weather_data["description"]
        
#         # make it pretty for frontend to load properly on the container in the card  
#         weather_info = (
#             f"Temperature: {temperature}°C\n"
#             f"Humidity: {humidity}%\n"
#             f"Pressure: {pressure} hPa\n"
#             f"Condition: {weather_description}"
#         )

#         return {"weather": weather_info}

#     else:
#         raise HTTPException(status_code=404, detail="City not found")

# @app.get("/{full_path:path}")
# async def serve_react(full_path: str):
#     # we tell the backend to load the contents into the index for anything that is not declared as an API route
#     index_path = os.path.join(static_dir, "index.html")
#     if os.path.exists(index_path):
#         return FileResponse(index_path)
#     raise HTTPException(status_code=404, detail="Page not found")