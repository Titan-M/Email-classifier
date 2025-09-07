import { NextRequest, NextResponse } from 'next/server';
import { EmailClassifier } from '@/lib/ai-classifier';

export async function POST(request: NextRequest) {
  try {
    const { subject, body, sender } = await request.json();
    
    const classifier = new EmailClassifier();
    const result = await classifier.classifyEmail(subject, body, sender || 'test@example.com');
    
    return NextResponse.json({
      success: true,
      classification: result,
      input: { subject, body, sender }
    });
    
  } catch (error) {
    console.error('Test AI error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to classify email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
