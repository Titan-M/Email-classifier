import { NextResponse } from 'next/server';

export const runtime = 'edge';

// This is a placeholder for the classification logic
// In a real implementation, you would call your ML model here
async function classifyEmail({ subject, body, sender }: { subject: string; body: string; sender: string }) {
  // This is a mock implementation - replace with actual ML model inference
  const categories = ['work', 'personal', 'spam', 'newsletter'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    category: randomCategory,
    confidence: Math.random(),
    subject,
    sender,
    body: body.substring(0, 100) + '...' // Return a preview
  };
}

export async function POST(req: Request) {
  try {
    const { subject = '', body = '', sender = 'unknown@example.com' } = await req.json();
    
    // Call the classification function
    const result = await classifyEmail({ subject, body, sender });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in classification:', error);
    return NextResponse.json(
      { error: 'Failed to process classification' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}