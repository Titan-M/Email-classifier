import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIClassificationResult, EmailCategory } from '@/types/email';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Python classifier API URL (default to localhost for development)
const PYTHON_API_URL = process.env.PYTHON_CLASSIFIER_URL || 'http://localhost:5000';

export class EmailClassifier {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Main classification method - uses custom ML model for category/priority
   * and Gemini only for summarization
   */
  async classifyEmail(subject: string, body: string, sender: string): Promise<AIClassificationResult> {
    console.log('🔍 Classifying email with custom ML model...');
    
    try {
      // Step 1: Get category and priority from our custom ML model
      const classification = await this.classifyWithMLModel(subject, body, sender);
      
      // Step 2: Generate summary using Gemini AI (generative task)
      const summary = await this.generateSummaryWithGemini(subject, body, sender);
      
      return {
        category: classification.category,
        priority: classification.priority,
        summary: summary,
      };
    } catch (error) {
      console.error('Error in classification pipeline:', error);
      
      // Fallback to keyword-based classification
      console.log('⚠️  Using fallback classification...');
      const fallbackCategory = this.getFallbackCategory(subject, body);
      const fallbackPriority = this.getFallbackPriority(subject, body);
      
      return {
        category: fallbackCategory,
        priority: fallbackPriority,
        summary: `Email from ${sender.split('<')[0].trim()}: ${subject.substring(0, 100)}${subject.length > 100 ? '...' : ''}`,
      };
    }
  }

  /**
   * Call our custom Python ML model for category and priority classification
   */
  private async classifyWithMLModel(subject: string, body: string, sender: string): Promise<{ category: EmailCategory; priority: 'High' | 'Medium' | 'Low' }> {
    try {
      const response = await fetch(`${PYTHON_API_URL}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          body,
          sender,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ ML Model classification:', {
        category: data.category,
        priority: data.priority,
        confidence: `${(data.category_confidence * 100).toFixed(1)}%`
      });

      // Validate the response
      if (!this.isValidCategory(data.category) || !this.isValidPriority(data.priority)) {
        throw new Error('Invalid classification from ML model');
      }

      return {
        category: data.category as EmailCategory,
        priority: data.priority as 'High' | 'Medium' | 'Low',
      };
    } catch (error) {
      console.error('❌ Error calling Python classifier:', error);
      throw error; // Will be caught by main classifyEmail method
    }
  }

  /**
   * Use Gemini AI ONLY for generating email summaries (generative task)
   */
  private async generateSummaryWithGemini(subject: string, body: string, sender: string): Promise<string> {
    const systemPrompt = `You are an AI assistant that creates concise email summaries.

Generate a detailed 3-4 sentence summary that captures:
- The main purpose of the email
- Key information and important details
- Any action items or deadlines
- Relevant context

Respond with ONLY the summary text, no JSON, no formatting.`;

    const userPrompt = `Email Subject: ${subject}
Email From: ${sender}
Email Body: ${body}`;

    try {
      const prompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      console.log('✅ Gemini summary generated');
      return summary;
    } catch (error) {
      console.error('Error generating summary with Gemini:', error);
      // Fallback summary
      return `Email from ${sender.split('<')[0].trim()} about: ${subject}. ${body.substring(0, 150)}${body.length > 150 ? '...' : ''}`;
    }
  }

  private isValidCategory(category: string): boolean {
    const validCategories = ['Work', 'Personal', 'Finance', 'Travel', 'Shopping', 'Promotions', 'Spam', 'Other'];
    return validCategories.includes(category);
  }

  private isValidPriority(priority: string): boolean {
    const validPriorities = ['High', 'Medium', 'Low'];
    return validPriorities.includes(priority);
  }

  private getFallbackCategory(subject: string, body: string): EmailCategory {
    const text = (subject + ' ' + body).toLowerCase();
    
    // Finance keywords
    const financeKeywords = ['bank', 'credit', 'payment', 'invoice', 'bill', 'statement', 'account', 'transaction', 'balance', 'due', 'paypal', 'visa', 'mastercard', 'amex', 'financial'];
    if (financeKeywords.some(keyword => text.includes(keyword))) {
      return 'Finance';
    }
    
    // Promotions keywords (check first to catch marketing emails)
    const promoKeywords = ['unsubscribe', 'newsletter', 'promotion', 'offer', 'sale', 'discount', 'coupon', 'deal', 'save', '%', 'limited time', 'exclusive', 'special offer', 'marketing', 'subscribe'];
    if (promoKeywords.some(keyword => text.includes(keyword))) {
      return 'Promotions';
    }
    
    // Shopping keywords
    const shoppingKeywords = ['order', 'purchase', 'delivery', 'shipped', 'cart', 'receipt', 'confirmation', 'tracking', 'amazon', 'ebay', 'shopify', 'store', 'product'];
    if (shoppingKeywords.some(keyword => text.includes(keyword))) {
      return 'Shopping';
    }
    
    // Work keywords
    const workKeywords = ['meeting', 'conference', 'project', 'work', 'office', 'colleague', 'team', 'deadline', 'business', 'professional', 'corporate', 'company'];
    if (workKeywords.some(keyword => text.includes(keyword))) {
      return 'Work';
    }
    
    // Travel keywords
    const travelKeywords = ['flight', 'hotel', 'booking', 'trip', 'travel', 'reservation', 'airline', 'airport', 'vacation', 'itinerary', 'check-in'];
    if (travelKeywords.some(keyword => text.includes(keyword))) {
      return 'Travel';
    }
    
    // Personal keywords
    const personalKeywords = ['family', 'friend', 'birthday', 'wedding', 'personal', 'private', 'social'];
    if (personalKeywords.some(keyword => text.includes(keyword))) {
      return 'Personal';
    }
    
    return 'Other';
  }

  private getFallbackPriority(subject: string, body: string): 'High' | 'Medium' | 'Low' {
    const text = (subject + ' ' + body).toLowerCase();
    
    // High priority indicators
    if (text.includes('urgent') || text.includes('asap') || text.includes('immediate') || 
        text.includes('deadline') || text.includes('payment due') || text.includes('overdue')) {
      return 'High';
    }
    
    // Low priority indicators  
    if (text.includes('newsletter') || text.includes('unsubscribe') || text.includes('fyi') || 
        text.includes('notification') || text.includes('update')) {
      return 'Low';
    }
    
    return 'Medium';
  }
}
