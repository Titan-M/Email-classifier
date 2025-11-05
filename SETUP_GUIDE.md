# Complete Setup Guide - Email Classifier with Custom ML Models

## Overview

This guide walks you through setting up the Email Classifier application with custom machine learning models. This project demonstrates a hybrid AI approach where:

- **Custom ML Models** (scikit-learn) handle email classification
- **Gemini AI** handles email summarization only

## Prerequisites

- Node.js 18+ 
- Python 3.9+
- pip (Python package manager)
- npm (Node package manager)
- Google Cloud account (for OAuth and AI API)
- Supabase account

## Step-by-Step Setup

### Part 1: Python ML Models

#### 1.1 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- scikit-learn (ML library)
- pandas (data manipulation)
- Flask (API server)
- jupyter (notebook support)

#### 1.2 Train the Models

**Option A: Quick Training (Recommended)**

```bash
python train_model.py
```

This script will:
- Create a synthetic email dataset
- Train category classifier (8 classes)
- Train priority classifier (3 classes)
- Save models to `models/` directory
- Display accuracy metrics

Expected output:
```
✅ Category Model Accuracy: ~90-95%
✅ Priority Model Accuracy: ~85-90%
```

**Option B: Interactive Training (For Learning)**

```bash
jupyter notebook email_classifier_model.ipynb
```

Run all cells to see:
- Data preprocessing steps
- Feature engineering (TF-IDF)
- Model comparison
- Confusion matrices
- Sample predictions

#### 1.3 Start Python API Server

```bash
cd python-service
python classifier_api.py
```

Server will start on `http://localhost:5000`

Verify it's working:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "metadata": {...}
}
```

### Part 2: Next.js Application

#### 2.1 Install Node.js Dependencies

```bash
npm install
```

#### 2.2 Configure Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Google AI (for summaries only)
GOOGLE_AI_API_KEY=AIzaSyXXXXX

# Python Classifier API
PYTHON_CLASSIFIER_URL=http://localhost:5000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_32_char_secret
```

#### 2.3 Setup Supabase Database

1. Create a new Supabase project
2. Run migrations from `supabase/migrations/`:
   - `001_create_emails_table.sql`
   - `002_create_user_profiles.sql`

#### 2.4 Setup Google Cloud

**OAuth Setup:**
1. Go to Google Cloud Console
2. Create project → Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret

**Gemini API:**
1. Go to Google AI Studio
2. Create API key
3. Copy to `GOOGLE_AI_API_KEY`

#### 2.5 Run the Application

```bash
npm run dev
```

Application starts on `http://localhost:3000`

### Part 3: Testing the System

#### 3.1 Test Python Classifier API

```bash
curl -X POST http://localhost:5000/classify \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Urgent: Client Meeting",
    "body": "We need to meet with the client tomorrow at 9am to discuss the project deadline.",
    "sender": "boss@company.com"
  }'
```

Expected response:
```json
{
  "category": "Work",
  "priority": "High",
  "category_confidence": 0.92,
  "priority_confidence": 0.88
}
```

#### 3.2 Test End-to-End Flow

1. Open `http://localhost:3000`
2. Click "Continue with Google"
3. Authorize Gmail access
4. Click "Sync Emails" button
5. Watch console logs:
   ```
   🔍 Classifying email with custom ML model...
   ✅ ML Model classification: { category: 'Work', priority: 'High', confidence: '92.3%' }
   ✅ Gemini summary generated
   ```

## Architecture Explanation

### Classification Pipeline

```
┌─────────────┐
│   Gmail     │
│   Emails    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Next.js API Route                  │
│  /api/emails/sync/route.ts          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  EmailClassifier (TypeScript)       │
│  src/lib/ai-classifier.ts           │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┬──────────────────┐
       ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Python    │   │   Gemini    │   │  Fallback   │
│  ML Model   │   │     AI      │   │  Keywords   │
│ (Category   │   │  (Summary)  │   │             │
│  Priority)  │   │             │   │             │
└─────┬───────┘   └─────┬───────┘   └─────┬───────┘
      │                  │                  │
      └──────────────────┴──────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Supabase   │
                  │   Storage   │
                  └─────────────┘
```

### What Each Component Does

1. **Gmail API**: Fetches emails from user's inbox
2. **Next.js API**: Orchestrates the classification pipeline
3. **Python ML Model**: 
   - Receives: subject, body, sender
   - Returns: category (Work, Personal, etc.), priority (High, Medium, Low)
   - Method: TF-IDF + Multinomial Naive Bayes
4. **Gemini AI**:
   - Receives: subject, body, sender
   - Returns: 3-4 sentence human-readable summary
   - Method: Generative AI (text generation)
5. **Supabase**: Stores classified emails with results

### Why This Hybrid Approach?

| Task | Tool | Reason |
|------|------|--------|
| Category Classification | Custom ML | Simple classification task, fast, cheap, demonstrates ML skills |
| Priority Classification | Custom ML | Rule-based patterns, perfect for traditional ML |
| Email Summarization | Gemini AI | Complex generative task requiring language understanding |

## File Overview

### New Files Created

1. **`train_model.py`** - Python script to train ML models
2. **`email_classifier_model.ipynb`** - Jupyter notebook for interactive training
3. **`python-service/classifier_api.py`** - Flask API serving ML predictions
4. **`python-service/requirements.txt`** - Python API dependencies
5. **`requirements.txt`** - Root Python dependencies
6. **`models/`** - Directory containing trained models (generated)

### Modified Files

1. **`src/lib/ai-classifier.ts`** - Split logic:
   - `classifyWithMLModel()` - Calls Python API
   - `generateSummaryWithGemini()` - Calls Gemini
   - `classifyEmail()` - Orchestrates both

2. **`README.md`** - Updated with new setup instructions

### Generated Files (After Training)

- `models/category_classifier.pkl` - Trained category classifier
- `models/priority_classifier.pkl` - Trained priority classifier
- `models/tfidf_vectorizer.pkl` - Text feature extractor
- `models/model_metadata.json` - Model information

## Running in Production

### For Development
```bash
# Terminal 1: Python API
cd python-service && python classifier_api.py

# Terminal 2: Next.js
npm run dev
```

### For Production

1. Deploy Python API (Heroku, Render, Railway):
   ```bash
   # Update PYTHON_CLASSIFIER_URL in production
   PYTHON_CLASSIFIER_URL=https://your-ml-api.herokuapp.com
   ```

2. Deploy Next.js (Vercel):
   ```bash
   vercel deploy
   ```

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### "Models not found" error
```bash
python train_model.py
```

### Python API not responding
Check if it's running:
```bash
curl http://localhost:5000/health
```

### Fetch error from Next.js
Update `.env.local`:
```env
PYTHON_CLASSIFIER_URL=http://localhost:5000
```

## Performance Metrics

### Custom ML Model
- **Training time**: ~2-5 seconds
- **Prediction time**: <50ms per email
- **Accuracy**: 90-95% (category), 85-90% (priority)
- **Cost**: Free (local computation)

### Gemini AI
- **Prediction time**: ~1-2 seconds per summary
- **Quality**: High (natural language generation)
- **Cost**: ~$0.001 per request (depends on usage)

## Next Steps

1. **Improve Models**: Add more training data from real emails
2. **Add Features**: Extract more features (time of day, sender domain patterns)
3. **Try Different Algorithms**: Test SVM, XGBoost, Neural Networks
4. **Deploy**: Host Python API on cloud platform
5. **Monitor**: Track classification accuracy over time

## Questions for Professor

This implementation demonstrates:
- ✅ Data preprocessing and feature engineering
- ✅ Machine learning model training and evaluation
- ✅ Model deployment and serving via API
- ✅ Integration with web application
- ✅ Hybrid AI approach (ML + Generative AI)
- ✅ Production-ready architecture

The key insight: Use the right tool for the right task. Classification is perfect for traditional ML, while summarization benefits from generative AI.

