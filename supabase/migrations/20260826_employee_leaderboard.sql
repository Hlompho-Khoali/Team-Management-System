create or replace function public.get_employee_leaderboard()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  completed_projects bigint,
  points bigint
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_url,
    count(distinct projects.id) filter (where projects.status = 'complete') as completed_projects,
    count(distinct projects.id) filter (where projects.status = 'complete') as points
  from public.profiles
  left join public.projects
    on projects.assigned_to = profiles.id
    or exists (
      select 1
      from public.team_members
      where team_members.team_id = projects.team_id
        and team_members.user_id = profiles.id
    )
  where profiles.role = 'employee'
  group by profiles.id, profiles.full_name, profiles.avatar_url
  order by points desc, profiles.full_name asc;
$$;

grant execute on function public.get_employee_leaderboard() to authenticated;
