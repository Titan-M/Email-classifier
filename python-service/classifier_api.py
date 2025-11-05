"""
Email Classifier API Service

Flask API that serves ML model predictions for email classification.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
from pathlib import Path
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js

# Load models at startup
MODEL_DIR = Path(__file__).parent.parent / 'models'
print("Loading models...")
try:
    category_path = MODEL_DIR / 'category_classifier.pkl'
    priority_path = MODEL_DIR / 'priority_classifier.pkl'
    vectorizer_path = MODEL_DIR / 'tfidf_vectorizer.pkl'
    metadata_path = MODEL_DIR / 'model_metadata.json'

    # Check if all files exist
    if not all(p.exists() for p in [category_path, priority_path, vectorizer_path, metadata_path]):
        print("⚠️  Model files missing. Running train_model.py...")
        import subprocess
        subprocess.run(["python", str(Path(__file__).parent.parent / "train_model.py")], check=True)

    # Now load them
    category_model = joblib.load(category_path)
    priority_model = joblib.load(priority_path)
    tfidf_vectorizer = joblib.load(vectorizer_path)
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    print("✅ Models loaded successfully!")
    print(f"   Category classes: {category_model.classes_}")
    print(f"   Priority classes: {priority_model.classes_}")

except Exception as e:
    print(f"❌ Error ensuring models are ready: {e}")
    raise


def preprocess_text(text):
    """Clean and preprocess text (must match training preprocessing)"""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML
    text = re.sub(r'http\S+|www\S+', 'URL', text)  # Replace URLs
    text = re.sub(r'\S+@\S+', 'EMAIL', text)  # Replace emails
    text = re.sub(r'\s+', ' ', text).strip()  # Normalize whitespace
    return text

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': True,
        'metadata': metadata
    })

@app.route('/classify', methods=['POST'])
def classify_email():
    """
    Classify an email
    
    Request body:
    {
        "subject": "Email subject",
        "body": "Email body",
        "sender": "sender@example.com"
    }
    
    Response:
    {
        "category": "Work",
        "priority": "High",
        "category_confidence": 0.95,
        "priority_confidence": 0.87
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        subject = data.get('subject', '')
        body = data.get('body', '')
        sender = data.get('sender', '')
        
        if not subject and not body:
            return jsonify({'error': 'Subject or body is required'}), 400
        
        # Combine and preprocess
        combined_text = f"{subject} {body}"
        processed_text = preprocess_text(combined_text)
        
        # Vectorize
        features = tfidf_vectorizer.transform([processed_text])
        
        # Predict category
        category = category_model.predict(features)[0]
        category_proba = category_model.predict_proba(features)[0]
        category_confidence = float(category_proba.max())
        
        # Predict priority
        priority = priority_model.predict(features)[0]
        priority_proba = priority_model.predict_proba(features)[0]
        priority_confidence = float(priority_proba.max())
        
        result = {
            'category': str(category),
            'priority': str(priority),
            'category_confidence': category_confidence,
            'priority_confidence': priority_confidence,
            'model_version': metadata.get('created_at', 'unknown')
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/classify/batch', methods=['POST'])
def classify_batch():
    """
    Classify multiple emails at once
    
    Request body:
    {
        "emails": [
            {"subject": "...", "body": "...", "sender": "..."},
            {"subject": "...", "body": "...", "sender": "..."}
        ]
    }
    """
    try:
        data = request.get_json()
        emails = data.get('emails', [])
        
        if not emails:
            return jsonify({'error': 'No emails provided'}), 400
        
        results = []
        for email in emails:
            subject = email.get('subject', '')
            body = email.get('body', '')
            
            combined_text = f"{subject} {body}"
            processed_text = preprocess_text(combined_text)
            features = tfidf_vectorizer.transform([processed_text])
            
            category = category_model.predict(features)[0]
            category_conf = float(category_model.predict_proba(features)[0].max())
            
            priority = priority_model.predict(features)[0]
            priority_conf = float(priority_model.predict_proba(features)[0].max())
            
            results.append({
                'category': str(category),
                'priority': str(priority),
                'category_confidence': category_conf,
                'priority_confidence': priority_conf
            })
        
        return jsonify({'results': results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API documentation"""
    return jsonify({
        'name': 'Email Classifier API',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'GET - Health check',
            '/classify': 'POST - Classify single email',
            '/classify/batch': 'POST - Classify multiple emails'
        },
        'model_info': metadata
    })

if __name__ == '__main__':
    print("\n" + "="*80)
    print("🚀 Email Classifier API Server")
    print("="*80)
    print("Starting server on http://localhost:5000")
    print("\nEndpoints:")
    print("  GET  /health          - Health check")
    print("  POST /classify        - Classify single email")
    print("  POST /classify/batch  - Classify multiple emails")
    print("\nPress Ctrl+C to stop the server")
    print("="*80 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

