import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailService } from '@/lib/gmail';
import { EmailClassifier } from '@/lib/ai-classifier';
import { createServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const emailLimit = body.limit || 20; // Default to 20 if not specified

    const supabase = createServiceRoleClient();
    const gmailService = new GmailService(session.accessToken);
    const classifier = new EmailClassifier();

    // Fetch emails from Gmail
    const gmailMessages = await gmailService.getRecentEmails(emailLimit);
    
    let processedCount = 0;
    let skippedCount = 0;

    for (const message of gmailMessages) {
      try {
        // Check if we already have this email
        const { data: existingEmail } = await supabase
          .from('emails')
          .select('id')
          .eq('gmail_id', message.id)
          .eq('user_id', session.user.id)
          .single();

        if (existingEmail) {
          skippedCount++;
          continue;
        }

        // Extract email content
        const emailContent = GmailService.extractEmailContent(message);

        // Classify the email using AI
        const classification = await classifier.classifyEmail(
          emailContent.subject,
          emailContent.body,
          emailContent.sender
        );

        // Store in database
        const { error } = await supabase
          .from('emails')
          .insert({
            user_id: session.user.id,
            gmail_id: message.id,
            subject: emailContent.subject,
            body: emailContent.body,
            sender: emailContent.sender,
            category: classification.category,
            priority: classification.priority,
            summary: classification.summary,
            received_at: emailContent.receivedAt.toISOString(),
          });

        if (error) {
          console.error('Error saving email:', error);
          continue;
        }

        processedCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error('Error processing email:', error);
        continue;
      }
    }

    // Update last sync time
    await supabase
      .from('user_profiles')
      .update({ last_email_sync: new Date().toISOString() })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      total: gmailMessages.length,
    });

  } catch (error) {
    console.error('Error in email sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
