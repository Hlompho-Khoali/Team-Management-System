alter table public.teams
  add column if not exists leader_id uuid references public.profiles(id) on delete set null;

create index if not exists teams_leader_id_idx
  on public.teams (leader_id);
