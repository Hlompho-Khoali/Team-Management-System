drop policy if exists "Authenticated users can read teams" on public.teams;

create policy "Authenticated users can read teams"
on public.teams
for select
to authenticated
using (true);