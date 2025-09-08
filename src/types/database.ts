export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      emails: {
        Row: {
          id: string
          user_id: string
          gmail_id: string
          subject: string
          body: string
          sender: string
          category: 'Work' | 'Personal' | 'Finance' | 'Travel' | 'Shopping' | 'Promotions' | 'Spam' | 'Other' | null
          priority: 'High' | 'Medium' | 'Low' | null
          summary: string | null
          received_at: string
          processed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gmail_id: string
          subject: string
          body: string
          sender: string
          category?: 'Work' | 'Personal' | 'Finance' | 'Travel' | 'Shopping' | 'Promotions' | 'Spam' | 'Other' | null
          priority?: 'High' | 'Medium' | 'Low' | null
          summary?: string | null
          received_at: string
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gmail_id?: string
          subject?: string
          body?: string
          sender?: string
          category?: 'Work' | 'Personal' | 'Finance' | 'Travel' | 'Shopping' | 'Promotions' | 'Spam' | 'Other' | null
          priority?: 'High' | 'Medium' | 'Low' | null
          summary?: string | null
          received_at?: string
          processed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          gmail_refresh_token: string | null
          last_email_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          gmail_refresh_token?: string | null
          last_email_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          gmail_refresh_token?: string | null
          last_email_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
