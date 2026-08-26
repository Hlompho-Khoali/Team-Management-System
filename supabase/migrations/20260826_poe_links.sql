create table if not exists public.poe_links (
  employee_id uuid primary key references public.profiles(id) on delete cascade,
  github_url text,
  linkedin_url text,
  updated_at timestamptz not null default now()
);

alter table public.poe_links enable row level security;

drop policy if exists "Employees can read own POE links" on public.poe_links;
create policy "Employees can read own POE links"
on public.poe_links for select to authenticated
using (employee_id = auth.uid());

drop policy if exists "Employees can create own POE links" on public.poe_links;
create policy "Employees can create own POE links"
on public.poe_links for insert to authenticated
with check (employee_id = auth.uid());

drop policy if exists "Employees can update own POE links" on public.poe_links;
create policy "Employees can update own POE links"
on public.poe_links for update to authenticated
using (employee_id = auth.uid())
with check (employee_id = auth.uid());
