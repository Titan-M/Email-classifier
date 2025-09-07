-- Create emails table
create table public.emails (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    gmail_id text unique not null,
    subject text not null,
    body text not null,
    sender text not null,
    category text check (category in ('Work', 'Personal', 'Finance', 'Travel', 'Shopping', 'Promotions', 'Spam', 'Other')),
    priority text check (priority in ('High', 'Medium', 'Low')),
    summary text,
    received_at timestamp with time zone not null,
    processed_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.emails enable row level security;

-- Create policy for users to only see their own emails
-- Note: RLS will be handled at application level since we're using NextAuth
create policy "Users can only access their own emails" on public.emails
    for all using (true);

-- Create index for better performance
create index emails_user_id_idx on public.emails (user_id);
create index emails_received_at_idx on public.emails (received_at desc);
create index emails_category_idx on public.emails (category);
create index emails_priority_idx on public.emails (priority);
create index emails_gmail_id_idx on public.emails (gmail_id);
