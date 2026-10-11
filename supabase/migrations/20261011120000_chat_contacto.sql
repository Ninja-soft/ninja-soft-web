-- Chat web → Telegram, formulario de contacto y panel /internal.
create extension if not exists pgcrypto;

-- Admins de /internal ---------------------------------------------------------
create table public.internal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.internal_admins where user_id = auth.uid());
$$;

-- Chat ------------------------------------------------------------------------
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  contact text not null check (char_length(contact) between 3 and 120),
  telegram_thread_id bigint unique,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index chat_sessions_one_open on public.chat_sessions (user_id) where closed_at is null;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('visitor', 'agent', 'system')),
  body text not null check (char_length(body) between 1 and 4000),
  telegram_message_id bigint,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index chat_messages_session on public.chat_messages (session_id, created_at);

-- Contacto ----------------------------------------------------------------------
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  business text,
  message text not null,
  ip_hash text not null,
  status text not null default 'nuevo' check (status in ('nuevo', 'respondido')),
  created_at timestamptz not null default now()
);

-- Configuración -------------------------------------------------------------------
create table public.email_templates (
  key text primary key check (key in ('contact_ack', 'contact_notify', 'chat_reply')),
  subject text not null,
  html text not null,
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table public.app_secrets (
  name text primary key check (name in ('telegram_bot_token', 'resend_api_key', 'telegram_webhook_secret')),
  value text not null,
  updated_at timestamptz not null default now()
);

create table public.rate_events (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index rate_events_bucket on public.rate_events (bucket, created_at);

-- RLS -------------------------------------------------------------------------------
alter table public.internal_admins enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.contact_requests enable row level security;
alter table public.email_templates enable row level security;
alter table public.app_settings enable row level security;
alter table public.app_secrets enable row level security;   -- sin políticas: sólo service_role
alter table public.rate_events enable row level security;   -- sin políticas: sólo service_role

create policy "admin se ve a sí mismo" on public.internal_admins
  for select to authenticated using (user_id = auth.uid());

create policy "visitante ve su sesión; admin ve todas" on public.chat_sessions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "visitante ve sus mensajes; admin ve todos" on public.chat_messages
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

create policy "admin lee contactos" on public.contact_requests
  for select to authenticated using (public.is_admin());
create policy "admin actualiza contactos" on public.contact_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin lee plantillas" on public.email_templates
  for select to authenticated using (public.is_admin());
create policy "admin edita plantillas" on public.email_templates
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin lee ajustes" on public.app_settings
  for select to authenticated using (public.is_admin());
create policy "admin crea ajustes" on public.app_settings
  for insert to authenticated with check (public.is_admin());
create policy "admin edita ajustes" on public.app_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- RPCs ------------------------------------------------------------------------------
-- Latido del widget: el visitante sigue en la página.
create or replace function public.chat_touch() returns void
language sql security definer set search_path = public as $$
  update public.chat_sessions set last_seen_at = now()
  where user_id = auth.uid() and closed_at is null;
$$;
revoke all on function public.chat_touch() from public;
grant execute on function public.chat_touch() to authenticated;

-- Config pública (no secreta) que necesita el widget.
create or replace function public.get_public_config() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'wait_minutes', coalesce(nullif((select value from public.app_settings where key = 'wait_minutes'), ''), '5')::int
  );
$$;
grant execute on function public.get_public_config() to anon, authenticated;

-- Realtime: el visitante recibe las respuestas al instante (respeta RLS).
alter publication supabase_realtime add table public.chat_messages;

-- Semillas ------------------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('notify_email', ''),
  ('sender', 'Ninja Soft <onboarding@resend.dev>'),
  ('wait_minutes', '5'),
  ('away_minutes', '2'),
  ('telegram_group_id', '-1003773063419'),
  ('forms_thread_id', ''),
  ('site_url', 'https://ninja-soft-web.vercel.app'),
  ('pos_internal_url', 'https://pos.soft.ninja/internal'),
  ('food_internal_url', 'https://food.soft.ninja/internal');

insert into public.email_templates (key, subject, html) values
('contact_ack', 'Recibimos tu consulta · Ninja Soft', $tpl$<!doctype html><html lang="es"><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#0b0720;padding:24px 32px"><img src="{{link_sitio}}/icon.png" width="40" height="40" alt="Ninja Soft" style="display:block"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:24px">¡Gracias, {{nombre}}!</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#3a3a3c">Recibimos tu consulta y te vamos a contactar a la brevedad.</p>
<p style="margin:0 0 6px;font-size:13px;color:#86868b">Tu mensaje</p>
<p style="margin:0 0 24px;padding:14px 16px;background:#f5f5f7;border-radius:12px;font-size:15px;line-height:1.5">{{mensaje}}</p>
<a href="{{link_sitio}}" style="display:inline-block;background:#ff4b22;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Visitar Ninja Soft</a>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #eeeeee;font-size:12px;color:#86868b">Ninja Soft · Urquiza 3164, Rosario, Santa Fe, Argentina</td></tr>
</table></td></tr></table></body></html>$tpl$),
('contact_notify', 'Nuevo contacto: {{nombre}}', $tpl$<!doctype html><html lang="es"><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden"><tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px">Nuevo contacto desde la web</h1>
<p style="margin:0 0 4px;font-size:15px"><b>Nombre:</b> {{nombre}}</p>
<p style="margin:0 0 4px;font-size:15px"><b>Email:</b> {{email}}</p>
<p style="margin:0 0 4px;font-size:15px"><b>Teléfono:</b> {{telefono}}</p>
<p style="margin:0 0 16px;font-size:15px"><b>Rubro:</b> {{rubro}}</p>
<p style="margin:0;padding:14px 16px;background:#f5f5f7;border-radius:12px;font-size:15px;line-height:1.5">{{mensaje}}</p>
<p style="margin:16px 0 0;font-size:12px;color:#86868b">{{fecha}} · Respondé este email para escribirle directo.</p>
</td></tr></table></td></tr></table></body></html>$tpl$),
('chat_reply', 'Te respondimos · Ninja Soft', $tpl$<!doctype html><html lang="es"><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#0b0720;padding:24px 32px"><img src="{{link_sitio}}/icon.png" width="40" height="40" alt="Ninja Soft" style="display:block"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px">{{nombre}}, te respondimos en el chat</h1>
<p style="margin:0 0 24px;padding:14px 16px;background:#f5f5f7;border-radius:12px;font-size:15px;line-height:1.5">{{respuesta}}</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#3a3a3c">Podés responder este email o seguir la conversación en la web.</p>
<a href="{{link_sitio}}" style="display:inline-block;background:#ff4b22;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Volver al chat</a>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #eeeeee;font-size:12px;color:#86868b">Ninja Soft · Urquiza 3164, Rosario, Santa Fe, Argentina</td></tr>
</table></td></tr></table></body></html>$tpl$);
