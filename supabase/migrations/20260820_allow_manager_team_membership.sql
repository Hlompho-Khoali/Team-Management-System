create policy "Managers can add team members"
on public.team_members
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
