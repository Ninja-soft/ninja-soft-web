-- La purga diaria pasa a una Edge Function (chat-purge) para borrar también las fotos del Storage.
alter table public.app_secrets drop constraint app_secrets_name_check;
alter table public.app_secrets add constraint app_secrets_name_check
  check (name in ('telegram_bot_token', 'resend_api_key', 'telegram_webhook_secret', 'cron_secret'));

insert into public.app_secrets (name, value)
values ('cron_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

-- Sesiones a purgar (sin mensajes nuevos hace 15 días).
create or replace function public.chat_sessions_to_purge() returns setof uuid
language sql stable security definer set search_path = public as $$
  select s.id from public.chat_sessions s
  where coalesce((select max(m.created_at) from public.chat_messages m where m.session_id = s.id), s.created_at)
        < now() - interval '15 days';
$$;
revoke all on function public.chat_sessions_to_purge() from public, anon, authenticated;

create extension if not exists pg_net;

select cron.unschedule('purge-old-chats');
select cron.schedule(
  'purge-old-chats',
  '15 6 * * *',
  $cron$
  select net.http_post(
    url := 'https://tgaromemhaixgdsdlxiq.supabase.co/functions/v1/chat-purge',
    headers := jsonb_build_object('x-cron-secret', (select value from public.app_secrets where name = 'cron_secret'))
  );
  $cron$
);
