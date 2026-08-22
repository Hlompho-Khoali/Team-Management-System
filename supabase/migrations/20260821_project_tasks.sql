create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists project_tasks_project_id_idx
  on public.project_tasks (project_id, created_at);

alter table public.project_tasks enable row level security;

drop policy if exists "Managers can manage project tasks" on public.project_tasks;
create policy "Managers can manage project tasks"
on public.project_tasks
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'manager'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'manager'
  )
);

drop policy if exists "Assigned employees can read project tasks" on public.project_tasks;
create policy "Assigned employees can read project tasks"
on public.project_tasks
for select
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_tasks.project_id
      and (
        projects.assigned_to = auth.uid()
        or exists (
          select 1 from public.team_members
          where team_members.team_id = projects.team_id
            and team_members.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "Assigned employees can complete project tasks" on public.project_tasks;
create policy "Assigned employees can complete project tasks"
on public.project_tasks
for update
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_tasks.project_id
      and (
        projects.assigned_to = auth.uid()
        or exists (
          select 1 from public.team_members
          where team_members.team_id = projects.team_id
            and team_members.user_id = auth.uid()
        )
      )
  )
)
with check (is_complete in (true, false));