drop policy if exists "Managers can create projects" on public.projects;
create policy "Managers can create projects"
on public.projects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'manager'
  )
);

drop policy if exists "Managers can read projects" on public.projects;
create policy "Managers can read projects"
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'manager'
  )
);

drop policy if exists "Employees can read projects" on public.projects;
create policy "Employees can read projects"
on public.projects
for select
to authenticated
using (
  assigned_to = auth.uid()
  or exists (
    select 1
    from public.team_members
    where public.team_members.team_id = projects.team_id
      and public.team_members.user_id = auth.uid()
  )
);

drop policy if exists "Managers can update projects" on public.projects;
create policy "Managers can update projects"
on public.projects
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'manager'
  )
);

drop policy if exists "Managers can delete projects" on public.projects;
create policy "Managers can delete projects"
on public.projects
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'manager'
  )
);
