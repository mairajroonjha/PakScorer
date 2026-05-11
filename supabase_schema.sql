-- PakScorer Supabase schema
-- Run this in Supabase SQL Editor before using the live database connection.

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default 'Unknown',
  captain text not null default 'Captain',
  record text not null default '0W - 0L',
  created_at timestamptz not null default now()
);

create unique index if not exists teams_name_unique_ci
on public.teams (lower(trim(name)));

alter table public.teams enable row level security;

drop policy if exists "Teams are publicly readable" on public.teams;
create policy "Teams are publicly readable"
on public.teams
for select
to anon
using (true);

drop policy if exists "Prototype can create teams" on public.teams;
create policy "Prototype can create teams"
on public.teams
for insert
to anon
with check (true);
