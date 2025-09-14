import os
from flask import Flask, request, render_template, jsonify
import librosa
import numpy as np
import joblib
import warnings

warnings.filterwarnings("ignore")

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load models
gunshot_model_path = "models/gunshot_model.pkl"
guntype_model_path = "models/gun_type_model.pkl"

gunshot_model = joblib.load(gunshot_model_path) if os.path.exists(gunshot_model_path) else None
guntype_model = joblib.load(guntype_model_path) if os.path.exists(guntype_model_path) else None

def extract_features(file_path):
    y, sr = librosa.load(file_path, sr=22050)
    
    # 40 MFCCs
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc_mean = np.mean(mfcc.T, axis=0)

    # Extra features
    zcr = np.mean(librosa.feature.zero_crossing_rate(y))
    spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
    energy = np.mean(y**2)
    rms = np.sqrt(energy)
    sound_intensity = 20 * np.log10(rms + 1e-10)  # dB
    duration = float(len(y) / sr)

    gunshot_features = mfcc_mean.reshape(1, -1)  # 40 features
    guntype_features = np.concatenate([mfcc_mean, [zcr, spectral_centroid, spectral_rolloff, energy]]).reshape(1, -1)  # 44 features

    return gunshot_features, guntype_features, y, sr, energy, duration, sound_intensity

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    try:
        gunshot_features, guntype_features, y, sr, energy, duration, sound_intensity = extract_features(filepath)

 # Gunshot detection
        if gunshot_model:
            pred_gunshot = gunshot_model.predict(gunshot_features)[0]
            conf_gunshot = float(max(gunshot_model.predict_proba(gunshot_features)[0]))
            result_gunshot = "Gunshot" if pred_gunshot == 1 else "Not Gunshot"
        else:
            result_gunshot = "Unknown"
            conf_gunshot = 0.0

        # Gun type
        if guntype_model and pred_gunshot == 1:
            pred_type = str(guntype_model.predict(guntype_features)[0])
        else:
            pred_type = "N/A"

        response = {
            "result_gunshot": result_gunshot,
            "confidence_gunshot": float(conf_gunshot),
            "gun_type": pred_type,
            "duration_sec": float(duration),
            "energy": float(energy),
            "sound_intensity_db": float(sound_intensity),
            "num_features_gunshot_model": int(gunshot_features.shape[1]),
            "num_features_guntype_model": int(guntype_features.shape[1])
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

