import { google } from 'googleapis';
import { GmailMessage } from '@/types/email';

export class GmailService {
  private gmail;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async getRecentEmails(maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      // Get list of message IDs - fetch all recent emails, not just unread
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'newer_than:30d -in:spam -in:trash', // Get emails from last 30 days, exclude spam/trash
      });

      const messages = response.data.messages || [];
      
      // Get full message details for each email
      const emailPromises = messages.map(async (message) => {
        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });
        return fullMessage.data as GmailMessage;
      });

      const emails = await Promise.all(emailPromises);
      return emails;
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  static extractEmailContent(message: GmailMessage): {
    subject: string;
    sender: string;
    body: string;
    receivedAt: Date;
  } {
    const headers = message.payload.headers || [];
    
    // Extract headers
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const sender = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
    const receivedAt = new Date(parseInt(message.internalDate));

    // Extract body content
    let body = '';
    
    if (message.payload.body?.data) {
      // Simple case: body data directly available
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
    } else if (message.payload.parts) {
      // Complex case: multipart message
      const textPart = this.findTextPart(message.payload.parts);
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
      }
    }

    // Clean up HTML tags if present and limit length
    body = body
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 2000); // Limit to 2000 characters for AI processing

    return {
      subject,
      sender,
      body: body || message.snippet || 'No content available',
      receivedAt,
    };
  }

  private static findTextPart(parts: any[]): any {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        return part;
      }
      if (part.parts) {
        const nestedPart = this.findTextPart(part.parts);
        if (nestedPart) return nestedPart;
      }
    }
    return null;
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }
}
