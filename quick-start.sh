#!/bin/bash

# Email Classifier - Quick Start Script
# This script sets up and runs the entire application

echo "============================================"
echo "Email Classifier - Quick Start"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Step 1: Install Python dependencies
echo "📦 Step 1: Installing Python dependencies..."
pip3 install -r requirements.txt
echo ""

# Step 2: Train ML models
echo "🤖 Step 2: Training ML models..."
if [ ! -f "models/category_classifier.pkl" ]; then
    echo "   Training models for the first time..."
    python3 train_model.py
else
    echo "   ✓ Models already exist (skipping training)"
    echo "   To retrain, delete models/*.pkl files"
fi
echo ""

# Step 3: Install Node.js dependencies
echo "📦 Step 3: Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   ✓ Node modules already installed (skipping)"
fi
echo ""

# Step 4: Check .env.local
echo "🔍 Step 4: Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo "   ⚠️  .env.local not found!"
    echo "   Please create .env.local with your configuration."
    echo "   See README.md for details."
    exit 1
else
    echo "   ✓ .env.local found"
fi
echo ""

echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "To start the application, run these commands"
echo "in separate terminal windows:"
echo ""
echo "Terminal 1 (Python API):"
echo "  cd python-service"
echo "  python3 classifier_api.py"
echo ""
echo "Terminal 2 (Next.js App):"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo "============================================"

