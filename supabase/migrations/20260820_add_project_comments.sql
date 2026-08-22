create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

alter table public.project_comments
  add column if not exists content text;

alter table public.project_comments
  add column if not exists comment text;

update public.project_comments
set content = coalesce(content, comment, ''),
    comment = coalesce(comment, content, '')
where content is null or comment is null;

alter table public.project_comments
  alter column content set not null;

alter table public.project_comments
  alter column comment set not null;

create index if not exists project_comments_project_id_idx
  on public.project_comments (project_id, created_at);

alter table public.project_comments enable row level security;

create policy "Managers can read project comments"
on public.project_comments
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'manager'
  )
);

create policy "Managers can add project comments"
on public.project_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'manager'
  )
);
