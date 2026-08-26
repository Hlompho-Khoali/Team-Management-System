-- Ensure both managers and employees can message each other when they are
-- members of the same conversation.

alter table if exists public.conversations enable row level security;
alter table if exists public.conversation_members enable row level security;
alter table if exists public.messages enable row level security;

-- Conversations

drop policy if exists "Users can read their conversations" on public.conversations;
drop policy if exists "Users can read member conversations" on public.conversations;

create policy "Users can read member conversations"
on public.conversations
for select
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
  )
);

-- Conversation members

drop policy if exists "Users can read conversation members" on public.conversation_members;
drop policy if exists "Conversation members can read conversation members" on public.conversation_members;

create policy "Conversation members can read conversation members"
on public.conversation_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
  )
);

-- Keep creator/self member insert behavior, but reset explicitly for consistency.
drop policy if exists "Conversation creators can add members" on public.conversation_members;

create policy "Conversation creators can add members"
on public.conversation_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = conversation_members.conversation_id
      and c.created_by = auth.uid()
  )
);

-- Messages

drop policy if exists "Conversation members can read messages" on public.messages;
drop policy if exists "Conversation members can send messages" on public.messages;

create policy "Conversation members can read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);

create policy "Conversation members can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);
