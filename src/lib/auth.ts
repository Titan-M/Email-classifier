import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createServerSupabaseClient } from './supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          const supabase = createServerSupabaseClient();
          
          // Use account.providerAccountId as the unique identifier
          const userId = account.providerAccountId;
          
          // Check if user profile exists, create if not
          const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', profile.email)
            .maybeSingle(); // Use maybeSingle to handle no results gracefully

          if (!existingProfile) {
            // Create new user profile with proper UUID generation
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId, // Use provider account ID
                email: profile.email,
                full_name: profile.name || null,
                avatar_url: profile.picture || null,
                gmail_refresh_token: account.refresh_token || null,
              });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              return false;
            }
          } else if (account.refresh_token) {
            // Update refresh token if it exists
            await supabase
              .from('user_profiles')
              .update({
                gmail_refresh_token: account.refresh_token,
                full_name: profile.name || existingProfile.full_name,
                avatar_url: profile.picture || existingProfile.avatar_url,
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
      // Persist the OAuth access_token and user info
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.userId = account.providerAccountId; // Store the provider account ID
      }
      if (profile) {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
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
};
