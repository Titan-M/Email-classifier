# ML Models Directory

This directory contains the trained machine learning models for email classification.

## Files Generated After Training

- `category_classifier.pkl` - Trained category classifier (8 classes)
- `priority_classifier.pkl` - Trained priority classifier (3 classes)
- `tfidf_vectorizer.pkl` - TF-IDF text feature extractor
- `model_metadata.json` - Model information and metrics

## How to Generate Models

Run one of the following:

```bash
# Option 1: Quick training script
python train_model.py

# Option 2: Interactive Jupyter notebook
jupyter notebook email_classifier_model.ipynb
```

## Model Details

### Category Classifier
- **Algorithm**: Multinomial Naive Bayes
- **Features**: TF-IDF (top 1000 words, unigrams + bigrams)
- **Classes**: Work, Personal, Finance, Travel, Shopping, Promotions, Spam, Other
- **Expected Accuracy**: 90-95%

### Priority Classifier  
- **Algorithm**: Multinomial Naive Bayes
- **Features**: TF-IDF (top 1000 words, unigrams + bigrams)
- **Classes**: High, Medium, Low
- **Expected Accuracy**: 85-90%

## Notes

- Models are in .gitignore and should be regenerated on each deployment
- Training takes only a few seconds
- Models are loaded by `python-service/classifier_api.py`

