-- Lista de chats para /internal: cada conversación con su último mensaje (sólo admins).
create or replace function public.internal_chat_list() returns table (
  id uuid, name text, contact text, telegram_thread_id bigint, created_at timestamptz, closed_at timestamptz,
  last_body text, last_sender text, last_media boolean, last_at timestamptz, total bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'sin acceso'; end if;
  return query
  select s.id, s.name, s.contact, s.telegram_thread_id, s.created_at, s.closed_at,
         m.body, m.sender, m.media_path is not null, coalesce(m.created_at, s.created_at),
         (select count(*) from public.chat_messages x where x.session_id = s.id)
  from public.chat_sessions s
  left join lateral (
    select body, sender, media_path, created_at from public.chat_messages
    where session_id = s.id order by created_at desc limit 1
  ) m on true
  order by coalesce(m.created_at, s.created_at) desc
  limit 300;
end;
$$;
revoke all on function public.internal_chat_list() from public, anon;
grant execute on function public.internal_chat_list() to authenticated;
