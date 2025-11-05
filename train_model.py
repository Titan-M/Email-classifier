"""
Email Classification Model Training Script

This script trains ML models for email classification and saves them for production use.
Run this script or use the Jupyter notebook for interactive training.
"""

import pandas as pd
import numpy as np
import re
import json
from datetime import datetime
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
import joblib

def create_training_dataset():
    """Create synthetic email dataset for training"""
    
    email_templates = {
        'Work': [
            ("Team Meeting Tomorrow", "Hi team, reminder about our project meeting tomorrow at 10am.", "manager@company.com", "Medium"),
            ("Urgent: Client Deadline", "The client needs the final report by EOD. Please prioritize this.", "boss@company.com", "High"),
            ("Project Update Required", "Can you send me an update on the current project status?", "colleague@company.com", "Medium"),
            ("Code Review Request", "Please review my pull request when you have time.", "developer@company.com", "Low"),
            ("Performance Review Meeting", "Scheduled your annual performance review for next Friday.", "hr@company.com", "High"),
        ],
        'Personal': [
            ("Dinner this weekend?", "Hey! Want to grab dinner this Saturday? Let me know!", "friend@gmail.com", "Low"),
            ("Family reunion next month", "Mom is organizing a family reunion. Can you make it?", "sister@gmail.com", "Medium"),
            ("Birthday party invitation", "You're invited to my birthday party next Friday!", "john@gmail.com", "Medium"),
        ],
        'Finance': [
            ("Your Credit Card Statement", "Your credit card statement is ready. Amount due: $1,234.56", "statements@bank.com", "High"),
            ("Payment Reminder", "This is a reminder that your payment of $500 is due in 3 days.", "billing@company.com", "High"),
            ("Transaction Alert", "A transaction of $89.99 was made on your account at Amazon.", "alerts@bank.com", "Low"),
            ("Invoice #12345", "Please find attached invoice for services rendered.", "accounts@vendor.com", "Medium"),
        ],
        'Travel': [
            ("Flight Confirmation", "Your flight from NYC to LAX is confirmed for Dec 15.", "noreply@airline.com", "High"),
            ("Hotel Reservation Confirmed", "Your reservation at Hilton Hotel is confirmed.", "reservations@hilton.com", "Medium"),
            ("Check-in reminder", "You can now check in for your flight departing tomorrow.", "checkin@airline.com", "Medium"),
        ],
        'Shopping': [
            ("Order Confirmation #12345", "Thanks for your order! Your items will ship within 2 days.", "orders@amazon.com", "Medium"),
            ("Your package is out for delivery", "Your package is out for delivery today.", "shipping@amazon.com", "Medium"),
            ("Item shipped", "Good news! Your order has shipped.", "noreply@store.com", "Low"),
        ],
        'Promotions': [
            ("50% OFF SALE THIS WEEKEND!", "Don't miss our biggest sale! Save 50% on everything!", "marketing@store.com", "Low"),
            ("Exclusive offer just for you", "Enjoy 20% off your next purchase. Use code SAVE20", "deals@shop.com", "Low"),
            ("Weekly Newsletter", "Check out this week's featured products and special offers.", "newsletter@company.com", "Low"),
        ],
        'Spam': [
            ("You've won $1,000,000!", "Congratulations! You've been selected. Click here to claim.", "winner@suspicious.com", "Low"),
            ("Urgent: Verify your account", "Your account will be closed unless you verify immediately.", "security@phishing.com", "High"),
            ("Make money from home!", "Work from home and earn $5000 per week! No experience needed.", "opportunity@scam.com", "Low"),
        ],
        'Other': [
            ("Subscription confirmation", "You're now subscribed to our service. Welcome!", "welcome@service.com", "Low"),
            ("Password reset request", "Someone requested a password reset for your account.", "noreply@app.com", "Medium"),
            ("System maintenance notification", "Our system will be down for maintenance this Sunday.", "admin@service.com", "Low"),
        ]
    }
    
    data = []
    for category, templates in email_templates.items():
        for subject, body, sender, priority in templates:
            # Add original
            data.append({
                'subject': subject,
                'body': body,
                'sender': sender,
                'category': category,
                'priority': priority
            })
            # Add variations
            for i in range(5):
                data.append({
                    'subject': subject,
                    'body': body + f" Additional context {i}.",
                    'sender': sender,
                    'category': category,
                    'priority': priority
                })
    
    return pd.DataFrame(data)

def preprocess_text(text):
    """Clean and preprocess text"""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML
    text = re.sub(r'http\S+|www\S+', 'URL', text)  # Replace URLs
    text = re.sub(r'\S+@\S+', 'EMAIL', text)  # Replace emails
    text = re.sub(r'\s+', ' ', text).strip()  # Normalize whitespace
    return text

def train_models():
    """Main training function"""
    
    print("="*80)
    print("EMAIL CLASSIFICATION MODEL TRAINING")
    print("="*80)
    
    # Create dataset
    print("\n1. Creating training dataset...")
    df = create_training_dataset()
    print(f"   ✅ Created {len(df)} samples")
    print(f"   Categories: {df['category'].value_counts().to_dict()}")
    
    # Preprocess
    print("\n2. Preprocessing text...")
    df['combined_text'] = df['subject'] + ' ' + df['body']
    df['processed_text'] = df['combined_text'].apply(preprocess_text)
    print("   ✅ Text preprocessing completed")
    
    # Feature extraction
    print("\n3. Extracting TF-IDF features...")
    tfidf_vectorizer = TfidfVectorizer(
        max_features=1000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.8,
        stop_words='english'
    )
    X = tfidf_vectorizer.fit_transform(df['processed_text'])
    print(f"   ✅ Feature matrix shape: {X.shape}")
    
    # Train Category Classifier
    print("\n4. Training Category Classifier...")
    y_category = df['category']
    X_train_cat, X_test_cat, y_train_cat, y_test_cat = train_test_split(
        X, y_category, test_size=0.2, random_state=42, stratify=y_category
    )
    
    category_model = MultinomialNB()
    category_model.fit(X_train_cat, y_train_cat)
    y_pred_cat = category_model.predict(X_test_cat)
    cat_accuracy = accuracy_score(y_test_cat, y_pred_cat)
    
    print(f"   ✅ Category Model Accuracy: {cat_accuracy:.2%}")
    print(f"\n   Classification Report:")
    print(classification_report(y_test_cat, y_pred_cat))
    
    # Train Priority Classifier
    print("\n5. Training Priority Classifier...")
    y_priority = df['priority']
    X_train_pri, X_test_pri, y_train_pri, y_test_pri = train_test_split(
        X, y_priority, test_size=0.2, random_state=42, stratify=y_priority
    )
    
    priority_model = MultinomialNB()
    priority_model.fit(X_train_pri, y_train_pri)
    y_pred_pri = priority_model.predict(X_test_pri)
    pri_accuracy = accuracy_score(y_test_pri, y_pred_pri)
    
    print(f"   ✅ Priority Model Accuracy: {pri_accuracy:.2%}")
    print(f"\n   Classification Report:")
    print(classification_report(y_test_pri, y_pred_pri))
    
    # Save models
    print("\n6. Saving models...")
    models_dir = Path('models')
    models_dir.mkdir(exist_ok=True)
    
    joblib.dump(category_model, models_dir / 'category_classifier.pkl')
    joblib.dump(priority_model, models_dir / 'priority_classifier.pkl')
    joblib.dump(tfidf_vectorizer, models_dir / 'tfidf_vectorizer.pkl')
    
    metadata = {
        'created_at': datetime.now().isoformat(),
        'category_model': {
            'name': 'MultinomialNB',
            'accuracy': float(cat_accuracy),
            'classes': list(category_model.classes_)
        },
        'priority_model': {
            'name': 'MultinomialNB',
            'accuracy': float(pri_accuracy),
            'classes': list(priority_model.classes_)
        },
        'vectorizer': {
            'max_features': 1000,
            'vocabulary_size': len(tfidf_vectorizer.get_feature_names_out())
        }
    }
    
    with open(models_dir / 'model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"   ✅ Models saved to {models_dir}/")
    print(f"      - category_classifier.pkl")
    print(f"      - priority_classifier.pkl")
    print(f"      - tfidf_vectorizer.pkl")
    print(f"      - model_metadata.json")
    
    # Test
    print("\n7. Testing with sample emails...")
    test_cases = [
        ("URGENT: Server Down", "Production server is down. Need immediate attention.", "High", "Work"),
        ("50% OFF Sale!", "Limited time offer on all items!", "Low", "Promotions"),
        ("Your package has shipped", "Order #123 is on the way", "Medium", "Shopping"),
    ]
    
    for subject, body, expected_pri, expected_cat in test_cases:
        combined = preprocess_text(f"{subject} {body}")
        features = tfidf_vectorizer.transform([combined])
        pred_cat = category_model.predict(features)[0]
        pred_pri = priority_model.predict(features)[0]
        print(f"   '{subject[:40]}...'")
        print(f"      → Category: {pred_cat}, Priority: {pred_pri}")
    
    print("\n" + "="*80)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("="*80)
    print("\nNext steps:")
    print("1. Start Python API: cd python-service && python classifier_api.py")
    print("2. Test API: curl -X POST http://localhost:5000/classify -d '{...}'")
    print("3. Start Next.js app: npm run dev")

if __name__ == '__main__':
    train_models()

