-- MentorHub: complete database setup. Safe to re-run: it resets the app tables first.
-- WARNING: this deletes all app data (profiles, matches, messages, posts, sessions, goals, reviews).
-- Your login accounts in Authentication are kept, and profiles are recreated for them at the end.

-- 0. Reset
drop policy if exists "participants use attachments" on storage.objects;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.reviews, public.sessions, public.goals,
  public.messages, public.posts, public.matches, public.profiles cascade;

-- 1. Base schema

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'mentee' check (role in ('mentor', 'mentee')),
  headline text,
  bio text,
  skills text[] default '{}'
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  mentee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),
  created_at timestamptz not null default now(),
  unique (mentor_id, mentee_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_path text,
  attachment_type text,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null,
  author_id uuid references public.profiles(id),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'mentee')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "edit own profile" on public.profiles for update using (auth.uid() = id);

create policy "participants read matches" on public.matches for select
  using (auth.uid() in (mentor_id, mentee_id));
create policy "mentees request matches" on public.matches for insert
  with check (auth.uid() = mentee_id);
create policy "mentors answer requests" on public.matches for update
  using (auth.uid() = mentor_id);

create policy "participants read messages" on public.messages for select
  using (exists (select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.mentor_id, m.mentee_id)));
create policy "participants send messages" on public.messages for insert
  with check (sender_id = auth.uid() and exists (select 1 from public.matches m
    where m.id = match_id and m.status = 'active' and auth.uid() in (m.mentor_id, m.mentee_id)));

create policy "published posts are public" on public.posts for select using (published);

-- Realtime for chat
alter publication supabase_realtime add table public.messages;

-- Private file bucket, limited to match participants (first folder = match id)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict do nothing;

create policy "participants use attachments" on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and exists (select 1 from public.matches m
    where m.id::text = (storage.foldername(name))[1] and auth.uid() in (m.mentor_id, m.mentee_id)))
  with check (bucket_id = 'attachments' and exists (select 1 from public.matches m
    where m.id::text = (storage.foldername(name))[1] and auth.uid() in (m.mentor_id, m.mentee_id)));

-- 2. Sessions, goals, reviews, blog authoring

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 45 check (duration_min between 15 and 180),
  topic text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  mentee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;
alter table public.goals enable row level security;
alter table public.reviews enable row level security;

create policy "participants read sessions" on public.sessions for select
  using (exists (select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.mentor_id, m.mentee_id)));
create policy "participants book sessions" on public.sessions for insert
  with check (created_by = auth.uid() and exists (select 1 from public.matches m
    where m.id = match_id and m.status = 'active' and auth.uid() in (m.mentor_id, m.mentee_id)));
create policy "participants update sessions" on public.sessions for update
  using (exists (select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.mentor_id, m.mentee_id)));

create policy "participants manage goals" on public.goals for all
  using (exists (select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.mentor_id, m.mentee_id)))
  with check (exists (select 1 from public.matches m
    where m.id = match_id and m.status = 'active' and auth.uid() in (m.mentor_id, m.mentee_id)));

create policy "reviews are public" on public.reviews for select using (true);
create policy "mentee reviews completed session" on public.reviews for insert
  with check (mentee_id = auth.uid() and exists (
    select 1 from public.sessions s join public.matches m on m.id = s.match_id
    where s.id = session_id and s.status = 'completed'
      and m.mentee_id = auth.uid() and m.mentor_id = reviews.mentor_id));

-- Blog: mentors write, authors manage their own posts (including drafts)
create policy "mentors write posts" on public.posts for insert
  with check (author_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'mentor'));
create policy "authors read own posts" on public.posts for select using (author_id = auth.uid());
create policy "authors edit own posts" on public.posts for update using (author_id = auth.uid());
create policy "authors delete own posts" on public.posts for delete using (author_id = auth.uid());

-- 3. Recreate profiles for accounts that already exist
insert into public.profiles (id, full_name, role)
select id, raw_user_meta_data->>'full_name', coalesce(raw_user_meta_data->>'role', 'mentee')
from auth.users
on conflict (id) do nothing;