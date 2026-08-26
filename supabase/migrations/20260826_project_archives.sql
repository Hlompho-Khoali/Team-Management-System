create table if not exists public.project_archives (
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  archived_at timestamptz not null default now(),
  primary key (project_id, employee_id)
);

alter table public.project_archives enable row level security;

drop policy if exists "Employees can read their archived projects" on public.project_archives;
create policy "Employees can read their archived projects"
on public.project_archives for select to authenticated
using (employee_id = auth.uid());

drop policy if exists "Employees can archive their projects" on public.project_archives;
create policy "Employees can archive their projects"
on public.project_archives for insert to authenticated
with check (
  employee_id = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = project_archives.project_id
      and projects.status = 'complete'
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

drop policy if exists "Employees can restore their projects" on public.project_archives;
create policy "Employees can restore their projects"
on public.project_archives for delete to authenticated
using (employee_id = auth.uid());