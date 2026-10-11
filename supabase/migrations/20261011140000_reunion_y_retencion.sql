-- Reunión por Teams en el formulario + retención de 15 días del chat.
alter table public.contact_requests
  add column meeting boolean not null default false,
  add column meeting_pref text;

-- Aviso a Lucas: fila "Reunión".
update public.email_templates
set updated_at = now(),
    html = replace(
      html,
      '<tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;color:#9ca3af">Rubro</td><td style="padding:8px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">{{rubro}}</td></tr>',
      '<tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;color:#9ca3af">Rubro</td><td style="padding:8px 0;border-top:1px solid #f3f4f6">{{rubro}}</td></tr>'
      || '<tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;color:#9ca3af">Reunión</td><td style="padding:8px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;font-weight:700">{{reunion}}</td></tr>'
    )
where key = 'contact_notify';

-- Retención: el historial del chat se borra a los 15 días sin actividad.
create extension if not exists pg_cron;

create or replace function public.purge_old_chats() returns void
language sql security definer set search_path = public as $$
  -- sesiones sin mensajes nuevos hace 15 días (los mensajes caen en cascada)
  delete from public.chat_sessions s
  where coalesce((select max(m.created_at) from public.chat_messages m where m.session_id = s.id), s.created_at)
        < now() - interval '15 days';
  -- visitantes anónimos que ya no tienen conversación
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < now() - interval '15 days'
    and not exists (select 1 from public.chat_sessions s where s.user_id = u.id);
  -- eventos de límite de envíos viejos
  delete from public.rate_events where created_at < now() - interval '1 day';
$$;
revoke all on function public.purge_old_chats() from public, anon, authenticated;

select cron.schedule('purge-old-chats', '15 6 * * *', 'select public.purge_old_chats()');
