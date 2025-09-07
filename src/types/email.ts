export type EmailCategory = 
  | 'Work'
  | 'Personal'
  | 'Finance'
  | 'Travel'
  | 'Shopping'
  | 'Promotions'
  | 'Spam'
  | 'Other';

export type EmailPriority = 'High' | 'Medium' | 'Low';

export interface Email {
  id: string;
  user_id: string;
  gmail_id: string;
  subject: string;
  body: string;
  sender: string;
  category: EmailCategory | null;
  priority: EmailPriority | null;
  summary: string | null;
  received_at: string;
  processed_at: string;
  created_at: string;
}

export interface AIClassificationResult {
  category: EmailCategory;
  priority: EmailPriority;
  summary: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  gmail_refresh_token: string | null;
  last_email_sync: string | null;
  created_at: string;
  updated_at: string;
}
