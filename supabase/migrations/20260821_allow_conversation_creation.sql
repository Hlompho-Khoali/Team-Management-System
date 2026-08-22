drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations"
on public.conversations
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can read their conversations" on public.conversations;
create policy "Users can read their conversations"
on public.conversations
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Conversation creators can add members" on public.conversation_members;
create policy "Conversation creators can add members"
on public.conversation_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversations
    where conversations.id = conversation_members.conversation_id
      and conversations.created_by = auth.uid()
  )
);

drop policy if exists "Users can read conversation members" on public.conversation_members;
create policy "Users can read conversation members"
on public.conversation_members
for select
to authenticated
using (user_id = auth.uid());