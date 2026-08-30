-- POE document templates (blank forms) and per-employee submissions/signatures.

create table if not exists public.poe_document_templates (
  document_type text primary key check (document_type in ('poe_brief', 'initial_evaluation', 'final_evaluation')),
  file_url text,
  file_name text,
  updated_at timestamptz not null default now()
);

alter table public.poe_document_templates enable row level security;

drop policy if exists "Authenticated users can read POE templates" on public.poe_document_templates;
create policy "Authenticated users can read POE templates"
on public.poe_document_templates for select to authenticated
using (true);

drop policy if exists "Managers can upsert POE templates" on public.poe_document_templates;
create policy "Managers can upsert POE templates"
on public.poe_document_templates for insert to authenticated
with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager'));

drop policy if exists "Managers can update POE templates" on public.poe_document_templates;
create policy "Managers can update POE templates"
on public.poe_document_templates for update to authenticated
using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager'))
with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager'));

create table if not exists public.poe_submissions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('poe_brief', 'initial_evaluation', 'final_evaluation')),
  file_url text,
  file_name text,
  submitted_at timestamptz,
  signed_file_url text,
  signed_file_name text,
  signed_at timestamptz,
  status text not null default 'not_submitted' check (status in ('not_submitted', 'submitted', 'signed')),
  updated_at timestamptz not null default now(),
  unique (employee_id, document_type)
);

alter table public.poe_submissions enable row level security;

drop policy if exists "Employees can read own POE submissions" on public.poe_submissions;
create policy "Employees can read own POE submissions"
on public.poe_submissions for select to authenticated
using (
  employee_id = auth.uid()
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);

drop policy if exists "Employees can create own POE submissions" on public.poe_submissions;
create policy "Employees can create own POE submissions"
on public.poe_submissions for insert to authenticated
with check (
  employee_id = auth.uid()
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);

drop policy if exists "Employees and managers can update POE submissions" on public.poe_submissions;
create policy "Employees and managers can update POE submissions"
on public.poe_submissions for update to authenticated
using (
  employee_id = auth.uid()
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
)
with check (
  employee_id = auth.uid()
  or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);

insert into storage.buckets (id, name, public)
values ('poe-templates', 'poe-templates', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('poe-submissions', 'poe-submissions', true)
on conflict (id) do update set public = true;

drop policy if exists "Managers can upload POE templates" on storage.objects;
create policy "Managers can upload POE templates"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'poe-templates'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);

drop policy if exists "Managers can update POE templates in storage" on storage.objects;
create policy "Managers can update POE templates in storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'poe-templates'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);

drop policy if exists "Employees and managers can upload POE submissions" on storage.objects;
create policy "Employees and managers can upload POE submissions"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'poe-submissions'
  and (
    name like (auth.uid()::text || '/%')
    or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
  )
);

drop policy if exists "Employees and managers can update POE submissions in storage" on storage.objects;
create policy "Employees and managers can update POE submissions in storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'poe-submissions'
  and (
    name like (auth.uid()::text || '/%')
    or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
  )
);
