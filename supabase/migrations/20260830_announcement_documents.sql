-- Allow managers to attach a downloadable document to an announcement.

alter table public.announcements
  add column if not exists file_url text,
  add column if not exists file_name text;

insert into storage.buckets (id, name, public)
values ('announcement-documents', 'announcement-documents', true)
on conflict (id) do update set public = true;

drop policy if exists "Managers can upload announcement documents" on storage.objects;
create policy "Managers can upload announcement documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'announcement-documents'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);

drop policy if exists "Managers can update announcement documents" on storage.objects;
create policy "Managers can update announcement documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'announcement-documents'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'manager')
);
