import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIClassificationResult, EmailCategory } from '@/types/email';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class EmailClassifier {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async classifyEmail(subject: string, body: string, sender: string): Promise<AIClassificationResult> {
    const systemPrompt = `You are an AI email assistant that classifies, summarizes, and prioritizes emails.

CATEGORIES:
- Work: Professional emails, meetings, work projects, colleagues, business communications
- Personal: Family, friends, personal matters, social communications
- Finance: Banks, credit cards, bills, invoices, payments, financial statements
- Travel: Flight bookings, hotel reservations, travel confirmations, itineraries
- Shopping: Order confirmations, shipping notifications, purchase receipts, e-commerce
- Promotions: Marketing emails, newsletters, sales offers, discount codes, advertisements
- Spam: Unwanted emails, suspicious content, phishing attempts
- Other: Everything else that doesn't fit the above categories

PRIORITY LEVELS:
- High: Urgent deadlines, payment due dates, important meetings, direct personal requests
- Medium: Regular business emails, non-urgent requests, general communications
- Low: Newsletters, promotional content, FYI emails, automated notifications

You must respond with ONLY a valid JSON object in this exact format:
{
  "category": "[one of: Work, Personal, Finance, Travel, Shopping, Promotions, Spam, Other]",
  "priority": "[one of: High, Medium, Low]",
  "summary": "[detailed 3-4 sentence summary in plain English that captures key information, important details, and context]"
}

Do not include any other text, explanations, or markdown formatting. Only return the JSON object.`;

    const userPrompt = `Email Subject: ${subject}
Email From: ${sender}
Email Body: ${body}`;

    try {
      const prompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('AI Response:', text); // Debug log

      // Clean the response text
      let cleanText = text.trim();
      
      // Try to extract JSON from various formats
      let jsonStr = '';
      
      // Method 1: Direct JSON response
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        jsonStr = cleanText;
      }
      // Method 2: JSON in code blocks
      else {
        const codeBlockMatch = cleanText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        }
        // Method 3: Find first complete JSON object
        else {
          const jsonMatch = cleanText.match(/\{[^{}]*(?:{[^{}]*}[^{}]*)*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
        }
      }
      
      if (!jsonStr) {
        throw new Error(`No valid JSON found in AI response: ${text}`);
      }

      console.log('Extracted JSON string:', jsonStr); // Debug log
      const classification = JSON.parse(jsonStr) as AIClassificationResult;

      // Validate the response
      if (!this.isValidCategory(classification.category) || 
          !this.isValidPriority(classification.priority) ||
          !classification.summary) {
        throw new Error(`Invalid classification response: ${JSON.stringify(classification)}`);
      }

      console.log('Successful classification:', classification); // Debug log
      return classification;
    } catch (error) {
      console.error('Error classifying email:', error);
      
      // Fallback classification with smart defaults
      const fallbackCategory = this.getFallbackCategory(subject, body);
      const fallbackPriority = this.getFallbackPriority(subject, body);
      
      return {
        category: fallbackCategory,
        priority: fallbackPriority,
        summary: `Email from ${sender.split('<')[0].trim()}: ${subject.substring(0, 100)}${subject.length > 100 ? '...' : ''}`,
      };
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
    const senderLower = '';
    
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
