import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

def load_json_lines_csv(file_path):
    records = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            # Skip CSV header line if present
            if line.startswith("source_corroboration") or line.startswith("record_id"):
                continue
            try:
                data = json.loads(line)
                records.append(data)
            except json.JSONDecodeError:
                continue
    return records

def extract_features_and_labels(records):
    X = []
    y = []

    for rec in records:
        # Extract features (handling missing values gracefully)
        source_corrob = float(rec.get('source_corroboration', rec.get('confidence', 0.5)))
        geo_consistency = float(rec.get('geospatial_consistency', 0.5))
        temp_consistency = float(rec.get('temporal_consistency', 0.5))
        media_authenticity = float(rec.get('media_authenticity', 0.5))
        anom_score = float(rec.get('anomaly_score', 0.0))

        # Label extraction
        status = str(rec.get('verification_status', rec.get('status', 'UNVERIFIED'))).upper()

        X.append([
            source_corrob,
            geo_consistency,
            temp_consistency,
            media_authenticity,
            anom_score
        ])
        y.append(status)

    feature_names = [
        'source_corroboration',
        'geospatial_consistency',
        'temporal_consistency',
        'media_authenticity',
        'anomaly_score'
    ]

    return pd.DataFrame(X, columns=feature_names), np.array(y)

def train_and_save_model():
    csv_path = os.path.join('backend', 'app', 'ai', 'synthetic_data.csv')
    
    if not os.path.exists(csv_path):
        # Fallback check
        csv_path = 'synthetic_data.csv'

    print(f"Loading data from: {csv_path}")
    records = load_json_lines_csv(csv_path)
    print(f"Successfully loaded {len(records)} JSON records.")

    if len(records) == 0:
        raise ValueError("No valid JSON records found in the dataset file!")

    X, y = extract_features_and_labels(records)

    # Check label distribution
    unique_labels, counts = np.unique(y, return_counts=True)
    print("Label Distribution:", dict(zip(unique_labels, counts)))

    if len(unique_labels) < 2:
        print("Warning: Only 1 unique class found in data. Splitting might fail or overfit.")

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(unique_labels) > 1 else None
    )

    # Train Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    print("\n--- Model Evaluation ---")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred))

    # Save model
    output_dir = os.path.join('backend', 'app', 'ai')
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, 'fake_report_model.joblib')
    
    joblib.dump(clf, model_path)
    print(f"Model successfully saved to: {model_path}")

if __name__ == '__main__':
    train_and_save_model()