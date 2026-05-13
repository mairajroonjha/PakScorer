-- PakScorer Supabase schema
-- Safe to run multiple times in Supabase SQL Editor.
-- This creates the first full prototype database without deleting existing data.

create extension if not exists pgcrypto;

-- Core teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default 'Unknown',
  captain text not null default 'Captain',
  record text not null default '0W - 0L',
  logo_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists teams_name_unique_ci
on public.teams (lower(trim(name)));

alter table public.teams
  add column if not exists logo_url text;

-- Team players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  name text not null,
  team text not null,
  role text not null default 'Player',
  batting_style text,
  bowling_style text,
  is_captain boolean not null default false,
  is_wicketkeeper boolean not null default false,
  runs integer not null default 0,
  wickets integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists players_team_name_unique_ci
on public.players (lower(trim(team)), lower(trim(name)));

create index if not exists players_team_id_idx
on public.players (team_id);

alter table public.players
  add column if not exists team_id uuid references public.teams(id) on delete cascade,
  add column if not exists batting_style text,
  add column if not exists bowling_style text,
  add column if not exists is_captain boolean not null default false,
  add column if not exists is_wicketkeeper boolean not null default false;

-- Team-to-team match requests
create table if not exists public.match_requests (
  id uuid primary key default gen_random_uuid(),
  from_team_id uuid references public.teams(id) on delete set null,
  to_team_id uuid references public.teams(id) on delete set null,
  from_team text not null,
  to_team text not null,
  venue text not null default 'Local Ground',
  overs integer not null default 20 check (overs > 0),
  match_date date,
  match_time time,
  format text not null default 'T20',
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Rejected', 'Cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists match_requests_from_team_idx
on public.match_requests (from_team_id);

create index if not exists match_requests_to_team_idx
on public.match_requests (to_team_id);

create index if not exists match_requests_status_idx
on public.match_requests (status);

-- Matches are created from accepted requests or tournament fixtures
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_request_id uuid references public.match_requests(id) on delete set null,
  tournament_id uuid,
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  team_a text not null,
  team_b text not null,
  venue text not null default 'Local Ground',
  overs integer not null default 20 check (overs > 0),
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Setup', 'Live', 'Completed', 'Cancelled')),
  toss_winner_team_id uuid references public.teams(id) on delete set null,
  batting_first_team_id uuid references public.teams(id) on delete set null,
  winner_team_id uuid references public.teams(id) on delete set null,
  result_text text,
  match_date date,
  match_time time,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists matches_team_a_idx
on public.matches (team_a_id);

create index if not exists matches_team_b_idx
on public.matches (team_b_id);

create index if not exists matches_status_idx
on public.matches (status);

-- Playing XI for match setup
create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  player_name text not null,
  is_playing boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists match_players_unique_player
on public.match_players (match_id, player_id);

-- Innings
create table if not exists public.innings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_number integer not null check (innings_number in (1, 2)),
  batting_team_id uuid references public.teams(id) on delete set null,
  bowling_team_id uuid references public.teams(id) on delete set null,
  batting_team text not null,
  bowling_team text not null,
  runs integer not null default 0,
  wickets integer not null default 0,
  legal_balls integer not null default 0,
  target integer,
  status text not null default 'Not Started' check (status in ('Not Started', 'Live', 'Completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists innings_match_number_unique
on public.innings (match_id, innings_number);

-- Ball-by-ball scoring source of truth
create table if not exists public.balls (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_id uuid not null references public.innings(id) on delete cascade,
  ball_number integer not null,
  over_number integer not null,
  ball_in_over integer not null,
  batter_id uuid references public.players(id) on delete set null,
  non_striker_id uuid references public.players(id) on delete set null,
  bowler_id uuid references public.players(id) on delete set null,
  batter_name text,
  bowler_name text,
  runs_bat integer not null default 0,
  runs_extra integer not null default 0,
  extra_type text check (extra_type is null or extra_type in ('Wide', 'No Ball', 'Bye', 'Leg Bye')),
  is_legal boolean not null default true,
  is_wicket boolean not null default false,
  wicket_type text,
  out_player_id uuid references public.players(id) on delete set null,
  commentary text,
  created_at timestamptz not null default now()
);

create unique index if not exists balls_innings_ball_unique
on public.balls (innings_id, ball_number);

create index if not exists balls_match_id_idx
on public.balls (match_id);

create index if not exists balls_innings_id_idx
on public.balls (innings_id);

-- Tournament module
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue text not null default 'Multiple venues',
  start_date date,
  end_date date,
  overs integer not null default 20 check (overs > 0),
  format text not null default 'Group + knockout',
  status text not null default 'Applications Open' check (status in ('Draft', 'Applications Open', 'Fixtures', 'Live', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create unique index if not exists tournaments_name_unique_ci
on public.tournaments (lower(trim(name)));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_tournament_id_fkey'
  ) then
    alter table public.matches
      add constraint matches_tournament_id_fkey
      foreign key (tournament_id)
      references public.tournaments(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.tournament_applications (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  team text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index if not exists tournament_applications_unique_team
on public.tournament_applications (tournament_id, team_id);

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  team text not null,
  group_name text,
  seed integer,
  created_at timestamptz not null default now()
);

create unique index if not exists tournament_teams_unique_team
on public.tournament_teams (tournament_id, team_id);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  team_a text not null,
  team_b text not null,
  round_name text not null default 'Group',
  fixture_date date,
  venue text not null default 'Local Ground',
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Live', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists fixtures_tournament_idx
on public.fixtures (tournament_id);

create table if not exists public.points_table (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  team text not null,
  played integer not null default 0,
  won integer not null default 0,
  lost integer not null default 0,
  tied integer not null default 0,
  no_result integer not null default 0,
  points integer not null default 0,
  net_run_rate numeric(8, 3) not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists points_table_unique_team
on public.points_table (tournament_id, team_id);

-- Stats snapshots, updated later from balls
create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  matches integer not null default 0,
  runs integer not null default 0,
  balls_faced integer not null default 0,
  fours integer not null default 0,
  sixes integer not null default 0,
  wickets integer not null default 0,
  balls_bowled integer not null default 0,
  runs_conceded integer not null default 0,
  catches integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists player_stats_unique_player
on public.player_stats (player_id);

create table if not exists public.team_stats (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  matches integer not null default 0,
  won integer not null default 0,
  lost integer not null default 0,
  tied integer not null default 0,
  no_result integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists team_stats_unique_team
on public.team_stats (team_id);

-- Row level security for browser prototype.
-- Later, replace insert/update/delete policies with authenticated role-based policies.
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.match_requests enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.innings enable row level security;
alter table public.balls enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_applications enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.fixtures enable row level security;
alter table public.points_table enable row level security;
alter table public.player_stats enable row level security;
alter table public.team_stats enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teams',
    'players',
    'match_requests',
    'matches',
    'match_players',
    'innings',
    'balls',
    'tournaments',
    'tournament_applications',
    'tournament_teams',
    'fixtures',
    'points_table',
    'player_stats',
    'team_stats'
  ]
  loop
    execute format('drop policy if exists "Prototype read %1$s" on public.%1$I', table_name);
    execute format('create policy "Prototype read %1$s" on public.%1$I for select to anon using (true)', table_name);

    execute format('drop policy if exists "Prototype insert %1$s" on public.%1$I', table_name);
    execute format('create policy "Prototype insert %1$s" on public.%1$I for insert to anon with check (true)', table_name);

    execute format('drop policy if exists "Prototype update %1$s" on public.%1$I', table_name);
    execute format('create policy "Prototype update %1$s" on public.%1$I for update to anon using (true) with check (true)', table_name);
  end loop;
end $$;

-- Enable Realtime for key scoring tables
-- Run this to allow the frontend to listen for live changes.
begin;
  -- Remove existing publication if it exists
  drop publication if exists supabase_realtime;
  
  -- Create publication for the tables we want to track
  create publication supabase_realtime for table 
    public.matches, 
    public.innings, 
    public.balls, 
    public.players;
commit;

