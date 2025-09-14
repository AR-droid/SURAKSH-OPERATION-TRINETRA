import os
import numpy as np
import librosa
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report


DATASET_PATH = "dataset"
MODEL_PATH = "models/gunshot_model.pkl"


SAMPLE_RATE = 22050
N_MFCC = 40

def extract_features(file_path):
    try:
        y, sr = librosa.load(file_path, sr=SAMPLE_RATE)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)
        features = np.mean(mfcc.T, axis=0)
        return features
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def load_dataset(dataset_path):
    X, y = [], []

    # Gun classes (all gunshot folders)
    guns_path = os.path.join(dataset_path, "guns")
    for gun_class in os.listdir(guns_path):
        gun_folder = os.path.join(guns_path, gun_class)
        if os.path.isdir(gun_folder):
            for file in os.listdir(gun_folder):
                if file.endswith(".wav"):
                    fpath = os.path.join(gun_folder, file)
                    features = extract_features(fpath)
                    if features is not None:
                        X.append(features)
                        y.append(1)  # Gunshot = 1

    # Not guns
    not_guns_path = os.path.join(dataset_path, "non guns")
    for file in os.listdir(not_guns_path):
        if file.endswith(".wav"):
            fpath = os.path.join(not_guns_path, file)
            features = extract_features(fpath)
            if features is not None:
                X.append(features)
                y.append(0)  # Not gunshot = 0

    return np.array(X), np.array(y)

def main():
    print("Loading dataset...")
    X, y = load_dataset(DATASET_PATH)
    print(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")


    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )


    print("Training model...")
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)


    y_pred = model.predict(X_test)
    print("Classification Report:\n", classification_report(y_test, y_pred))

  
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved at {MODEL_PATH}")

if __name__ == "__main__":
    main()
