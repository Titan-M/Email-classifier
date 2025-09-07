-- Create user profiles table
create table public.user_profiles (
    id text primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    gmail_refresh_token text,
    last_email_sync timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;

-- Create policy for users to only access their own profile
-- Note: RLS will be handled at application level since we're using NextAuth
create policy "Users can manage their own profile" on public.user_profiles
    for all using (true);
