# run.py
import os
import json
import joblib
import pandas as pd
import numpy as np
import streamlit as st

# ----------------------
# Config / paths
# ----------------------
MODEL_DIR = os.path.join("app", "models")
DATA_PATH = os.path.join("data", "processed", "cleaned_weather.csv")
BABYLON_PATH = os.path.join("app", "frontend", "babylon_simulation.html")

# ----------------------
# Helpers
# ----------------------
def load_models(model_dir: str):
    models = {}
    if not os.path.exists(model_dir):
        return models
    for fname in os.listdir(model_dir):
        if fname.lower().endswith(".joblib"):
            try:
                models[fname[:-7]] = joblib.load(os.path.join(model_dir, fname))
            except Exception:
                continue
    return models

def safe_read_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        return pd.DataFrame()
    try:
        return pd.read_csv(path)
    except Exception:
        return pd.DataFrame()

def normalize_colname(s: str) -> str:
    return "".join(ch for ch in str(s).lower() if ch.isalnum())

def best_value_from_series(series: pd.Series, keys: list):
    if series is None:
        return None
    for col in series.index:
        ncol = normalize_colname(col)
        for key in keys:
            if normalize_colname(key) in ncol:
                try:
                    return float(series[col])
                except Exception:
                    pass
    return None

# ----------------------
# Streamlit UI
# ----------------------
st.set_page_config(page_title="Weather-Aware Bullet Simulation", layout="centered")
st.title("🔮 Weather-Aware Bullet Simulation (Babylon.js)")
st.write("Forecast + Ballistics = Predictive Gunshot Simulation — educational visualization")

# Load models
with st.spinner("📂 Loading models..."):
    models = load_models(MODEL_DIR)
st.success(f"✅ Loaded {len(models)} models from {MODEL_DIR}")

# Load dataset
df = safe_read_csv(DATA_PATH)
last_numeric_row = None
if not df.empty:
    numeric_df = df.select_dtypes(include=[np.number]).dropna()
    if not numeric_df.empty:
        last_numeric_row = numeric_df.iloc[-1]

# Resolve variables (synthetic defaults if not found)
def resolve_variable(keys, default):
    val = best_value_from_series(last_numeric_row, keys)
    return val if val is not None else default

wind_speed_val = resolve_variable(["wind_speed", "windspeed", "wind"], 12.0)
wind_dir_val = resolve_variable(["wind_direction", "winddir"], 60.0)
humidity_val = resolve_variable(["humidity", "relative_humidity"], 70.0)
pressure_val = resolve_variable(["pressure", "msl"], 1008.0)
rain_val = resolve_variable(["rain", "precip", "rain_intensity"], 4.0)

# Show chosen inputs
st.subheader("🔎 Weather inputs used for simulation")
st.markdown(
    f"- **Wind speed:** {wind_speed_val:.2f} km/h  \n"
    f"- **Wind direction:** {wind_dir_val:.1f}°  \n"
    f"- **Relative humidity:** {humidity_val:.1f}%  \n"
    f"- **Pressure:** {pressure_val:.1f} hPa  \n"
    f"- **Rain intensity:** {rain_val:.1f}/10  \n\n"
    "_Source: dataset last row if available, otherwise synthetic defaults._"
)

# ----------------------
# Babylon.js embed
# ----------------------
st.subheader("🎮 Interactive Bullet Simulation (Babylon.js)")

if os.path.exists(BABYLON_PATH):
    with open(BABYLON_PATH, "r", encoding="utf-8") as f:
        html_code = f.read()

    payload = {
        "type": "updateParams",
        "windSpeed_kmh": float(wind_speed_val),
        "windDir_deg": float(wind_dir_val),
        "humidity_pct": float(humidity_val),
        "pressure_hpa": float(pressure_val),
        "rain": float(rain_val),
        "slowMotion": True
    }

    js_message = (
        "<script>\n"
        "window.addEventListener('load', function(){\n"
        "  const tryPost = () => {\n"
        "    const iframe = document.querySelector('iframe');\n"
        "    if (!iframe || !iframe.contentWindow) { setTimeout(tryPost, 200); return; }\n"
        f"    iframe.contentWindow.postMessage({json.dumps(payload)}, '*');\n"
        "  };\n"
        "  setTimeout(tryPost, 300);\n"
        "});\n"
        "</script>\n"
    )

    st.components.v1.html(html_code + js_message, height=720, scrolling=False)
else:
    st.error(f"❌ Babylon.js file not found at {BABYLON_PATH}")

st.caption("Tip: Use FIRE to launch the bullet. Weather parameters (wind, rain, humidity, pressure) are injected automatically.")
