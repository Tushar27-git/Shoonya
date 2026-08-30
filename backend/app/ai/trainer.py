from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_PATH = BASE_DIR / "data" / "verification_dataset.csv"
MODEL_PATH = BASE_DIR / "models" / "verification_model.joblib"


FEATURES = [
    "source_corroboration",
    "geospatial_consistency",
    "temporal_consistency",
    "visual_evidence",
    "contradiction_penalty",
    "baseline_prior",
    "victim_count",
    "urgency",
]


def train_model():

    df = pd.read_csv(DATASET_PATH)

    # Missing values
    df["visual_evidence"] = df["visual_evidence"].fillna(0.5)
    df["victim_count"] = df["victim_count"].fillna(0)

    X = df[FEATURES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("=== MODEL EVALUATION ===")
    print(classification_report(y_test, predictions, zero_division=0))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(
        {
            "model": model,
            "features": FEATURES,
        },
        MODEL_PATH
    )

    print(f"Model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
