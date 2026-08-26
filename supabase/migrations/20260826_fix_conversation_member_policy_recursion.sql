-- Fix recursive RLS evaluation on conversation_members.
-- The previous select policy referenced conversation_members inside its USING clause,
-- which triggers infinite recursion in PostgreSQL policy evaluation.

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;

-- conversation_members: replace recursive select policy

drop policy if exists "Conversation members can read conversation members" on public.conversation_members;

create policy "Conversation members can read conversation members"
on public.conversation_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_conversation_member(conversation_id)
);

-- conversations: use helper to avoid recursive policy chains

drop policy if exists "Users can read member conversations" on public.conversations;

create policy "Users can read member conversations"
on public.conversations
for select
to authenticated
using (
  created_by = auth.uid()
  or public.is_conversation_member(id)
);

-- messages: use helper for member checks

drop policy if exists "Conversation members can read messages" on public.messages;
drop policy if exists "Conversation members can send messages" on public.messages;

create policy "Conversation members can read messages"
on public.messages
for select
to authenticated
using (
  public.is_conversation_member(conversation_id)
);

create policy "Conversation members can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);
