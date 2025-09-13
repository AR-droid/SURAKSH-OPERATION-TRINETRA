# app/utils.py

import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd
from pathlib import Path

# Load API key from .env file
load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Base URL for OpenWeather (current weather + forecast)
BASE_URL = "https://api.openweathermap.org/data/2.5/forecast"

def fetch_weather(city="Chennai", country="IN"):
    """
    Fetch real-time weather forecast for a city
    and save it into data/raw/weather_data_YYYYMMDD_HHMMSS.json
    """
    url = f"{BASE_URL}?q={city},{country}&appid={API_KEY}&units=metric"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        file_path = os.path.join(
            "data",
            "raw",
            f"weather_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        Path("data/raw").mkdir(parents=True, exist_ok=True)
        with open(file_path, "w") as f:
            json.dump(data, f, indent=4)
        print(f"✅ Weather data saved to {file_path}")
        return file_path  # return file path of saved JSON
    else:
        print(f"❌ Failed to fetch weather: {response.status_code}, {response.text}")
        return None

def process_forecast_json(json_file, output_csv="data/processed/weather_data.csv"):
    """
    Read a saved OpenWeather forecast JSON and convert it to a flat CSV.
    Appends to an existing CSV instead of overwriting.
    """
    with open(json_file, "r") as f:
        data = json.load(f)

    records = []
    city_name = data["city"]["name"]

    for entry in data["list"]:
        rain = entry.get("rain", {}).get("3h", 0)
        records.append({
            "city": city_name,
            "datetime": entry["dt_txt"],
            "temp": entry["main"]["temp"],
            "feels_like": entry["main"]["feels_like"],
            "humidity": entry["main"]["humidity"],
            "pressure": entry["main"]["pressure"],
            "wind_speed": entry["wind"]["speed"],
            "clouds": entry["clouds"]["all"],
            "weather": entry["weather"][0]["main"],
            "description": entry["weather"][0]["description"],
            "rain_3h_mm": rain
        })

    df_new = pd.DataFrame(records)

    Path(output_csv).parent.mkdir(parents=True, exist_ok=True)

    if Path(output_csv).exists():
        df_old = pd.read_csv(output_csv)
        df_all = pd.concat([df_old, df_new], ignore_index=True)
    else:
        df_all = df_new

    df_all.to_csv(output_csv, index=False)
    print(f"✅ Processed data appended to {output_csv}")
    return df_all

if __name__ == "__main__":
    # Fetch new weather data and immediately process it
    json_path = fetch_weather("Chennai", "IN")
    if json_path:
        process_forecast_json(json_path)
