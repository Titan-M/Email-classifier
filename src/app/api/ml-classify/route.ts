import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {

  try {
    const { subject = '', body = '', sender = 'unknown@example.com' } = await req.json();
    
    // Use relative URL since it's deployed on the same Vercel instance
    const apiUrl = '/api/classify';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        body,
        sender
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ML classification:', error);
    return NextResponse.json(
      { error: 'Failed to process classification' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
