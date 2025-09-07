# Email Classifier

AI-powered email classification and management system using Next.js, Supabase, and Google APIs.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Gmail access
- 🤖 **AI Classification** - Automatically categorize emails using Google's Gemini AI
- 🏷️ **Smart Prioritization** - High, Medium, Low priority based on content analysis  
- 📱 **Responsive UI** - Clean inbox interface with category tabs
- 🔒 **Privacy First** - Emails stored securely in Supabase with Row Level Security

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google AI Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
6. Copy the Client ID and Client Secret to your `.env.local`

### 3. Google AI API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini
3. Copy the key to `GOOGLE_AI_API_KEY` in your `.env.local`

### 4. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/` to create tables
3. Copy your project URL and keys to `.env.local`

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

1. **Sign In**: Click "Continue with Google" and authorize Gmail access
2. **Sync Emails**: Click "Sync Emails" button to fetch and classify recent emails
3. **Browse Categories**: Use tabs to filter emails by category (Work, Finance, etc.)
4. **View Details**: Click expand arrow to see AI summary and full email content

## Email Categories

- **Work**: Professional emails, meetings, work-related tasks
- **Personal**: Family, friends, personal matters
- **Finance**: Banks, credit cards, bills, financial statements  
- **Travel**: Bookings, itineraries, travel-related emails
- **Shopping**: Orders, receipts, promotions from stores
- **Promotions**: Marketing emails, newsletters, offers
- **Spam**: Unwanted or suspicious emails
- **Other**: Everything else that doesn't fit other categories
