-- El visitante puede cerrar su conversación y empezar una nueva.
create or replace function public.chat_close() returns void
language sql security definer set search_path = public as $$
  update public.chat_sessions set closed_at = now()
  where user_id = auth.uid() and closed_at is null;
$$;
revoke all on function public.chat_close() from public;
grant execute on function public.chat_close() to authenticated;
