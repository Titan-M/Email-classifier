import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

// Log the status of environment variables for debugging on Vercel
console.log('--- Checking Environment Variables ---');
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    console.log(`[✔] ${key} is loaded.`);
  } else {
    console.error(`[❌] ${key} is MISSING or empty.`);
  }
}
console.log('------------------------------------');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // needs service role for inserts/updates
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', profile.email)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching user profile:', fetchError);
            return false;
          }

          if (!existingProfile && profile.sub) {
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: profile.sub, // Use Google's unique user ID as our primary key
                email: profile.email!,
                full_name: profile.name || null,
                avatar_url: profile.image || null,
                gmail_refresh_token: account.refresh_token || null,
              });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              return false;
            }
          } else if (account.refresh_token) {
            await supabase
              .from('user_profiles')
              .update({
                gmail_refresh_token: account.refresh_token,
                full_name: profile.name || existingProfile.full_name,
                avatar_url: profile.image || existingProfile.avatar_url,
              })
              .eq('email', profile.email);
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.userId = account.providerAccountId;
      }
      if (profile) {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
};
