import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 });
  }

  try {
    const { subject = '', body = '', sender = 'unknown@example.com' } = await req.json();
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'python-service', 'classifier_api.py');
    
    // Run the Python script
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, '--predict', JSON.stringify({ subject, body, sender })]);
      let result = '';

      python.stdout.on('data', (data) => {
        result += data.toString();
      });

      python.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
      });

      python.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python script exited with code ${code}`));
        }
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(e);
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ML classification:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to process classification' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}