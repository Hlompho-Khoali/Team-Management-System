create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  file_url text,
  file_name text,
  submission_link text,
  created_at timestamptz not null default now(),
  check (file_url is not null or submission_link is not null)
);

create index if not exists project_submissions_project_id_idx
  on public.project_submissions (project_id, created_at desc);

alter table public.project_submissions enable row level security;

drop policy if exists "Employees can submit project work" on public.project_submissions;
create policy "Employees can submit project work"
on public.project_submissions for insert to authenticated
with check (employee_id = auth.uid());

drop policy if exists "Employees can read own submissions" on public.project_submissions;
create policy "Employees can read own submissions"
on public.project_submissions for select to authenticated
using (employee_id = auth.uid());

drop policy if exists "Managers can read project submissions" on public.project_submissions;
create policy "Managers can read project submissions"
on public.project_submissions for select to authenticated
using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager'));

insert into storage.buckets (id, name, public)
values ('project-submissions', 'project-submissions', true)
on conflict (id) do update set public = true;

drop policy if exists "Employees can upload project submissions" on storage.objects;
create policy "Employees can upload project submissions"
on storage.objects for insert to authenticated
with check (bucket_id = 'project-submissions' and name like (auth.uid()::text || '/%'));