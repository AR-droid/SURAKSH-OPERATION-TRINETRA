# app/utils.py

import pandas as pd
from pathlib import Path


def load_open_meteo_csv(raw_file, output_csv="data/processed/weather_data.csv"):
    """
    Load an Open-Meteo CSV file (with metadata header),
    skip the metadata lines, clean up column names and
    save a processed CSV ready for training.
    """
    # Skip first 3 lines (lat/lon, metadata, blank)
    df = pd.read_csv(raw_file, skiprows=3)

    # Optional: clean up column names using pandas.pipe for readability
    def clean_columns(cols):
        return (
            cols
            .str.strip()                # remove spaces
            .str.lower()                # lower case
            .str.replace(' ', '_')      # spaces to underscores
            .str.replace(r'[\(\)%/°]+', '', regex=True)  # remove symbols
        )

    df.columns = df.columns.pipe(clean_columns)

    # Ensure timestamp column is datetime
    if 'time' in df.columns:
        df['time'] = pd.to_datetime(df['time'])

    # Save processed CSV in 'data/processed' directory
    output_path = Path("data/processed") / Path(output_csv).name
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"✅ Processed Open-Meteo data saved to {output_path}")

    return df

if __name__ == "__main__":
    # Example usage: load a specific file and process it
    df = load_open_meteo_csv("data/raw/open-meteo-13.11N80.25E15m.csv")
    print(df.head())
