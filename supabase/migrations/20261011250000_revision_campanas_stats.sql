-- Correcciones de la revisión: envíos de campañas sin duplicar, bajas protegidas, estadísticas eficientes.

-- 1) Destinatarios: estado intermedio "sending" (reclamado por un lote) para que dos pestañas no envíen lo mismo.
alter table public.campaign_recipients drop constraint campaign_recipients_status_check;
alter table public.campaign_recipients add constraint campaign_recipients_status_check check (status in ('pending', 'sending', 'sent', 'failed'));
alter table public.campaign_recipients add column claimed_at timestamptz;

-- Reclama atómicamente hasta p_limit pendientes (o reclamados hace más de 10 min y nunca confirmados).
create or replace function public.campaign_claim(p_campaign uuid, p_limit int default 100)
returns table (contact_id uuid, email text, name text, unsub_token uuid, unsubscribed_at timestamptz)
language sql security definer set search_path = public as $$
  with picked as (
    select r.campaign_id, r.contact_id from public.campaign_recipients r
    where r.campaign_id = p_campaign
      and (r.status = 'pending' or (r.status = 'sending' and r.claimed_at < now() - interval '10 minutes'))
    order by r.contact_id
    limit greatest(1, least(p_limit, 100))
    for update skip locked
  ), upd as (
    update public.campaign_recipients r set status = 'sending', claimed_at = now()
    from picked where r.campaign_id = picked.campaign_id and r.contact_id = picked.contact_id
    returning r.contact_id
  )
  select c.id, c.email, c.name, c.unsub_token, c.unsubscribed_at from upd join public.contacts c on c.id = upd.contact_id;
$$;
revoke all on function public.campaign_claim(uuid, int) from public, anon, authenticated;

-- 2) Arranque en una sola transacción: crea (o convierte el borrador) y carga TODOS los suscriptos (sin el tope de 1000 filas).
create or replace function public.campaign_start(p_subject text, p_html text, p_user uuid, p_draft uuid default null)
returns table (id uuid, total int)
language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
  n int;
begin
  select count(*) into n from public.contacts where unsubscribed_at is null;
  if n = 0 then raise exception 'No hay contactos suscriptos.'; end if;
  if p_draft is not null then
    update public.campaigns set subject = p_subject, html = p_html, status = 'sending', total = n, created_at = now(), updated_at = now()
    where campaigns.id = p_draft and status = 'draft' returning campaigns.id into cid;
    if cid is null then raise exception 'El borrador ya no existe o ya fue enviado.'; end if;
  else
    insert into public.campaigns (subject, html, status, total, created_by) values (p_subject, p_html, 'sending', n, p_user) returning campaigns.id into cid;
  end if;
  insert into public.campaign_recipients (campaign_id, contact_id)
  select cid, c.id from public.contacts c where c.unsubscribed_at is null;
  return query select cid, n;
end;
$$;
revoke all on function public.campaign_start(text, text, uuid, uuid) from public, anon, authenticated;

-- 3) Una baja sólo la revierte el sistema (no un clic en el panel).
create or replace function public.protect_unsubscribe() returns trigger
language plpgsql as $$
begin
  if old.unsubscribed_at is not null and new.unsubscribed_at is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Un contacto dado de baja no se puede volver a suscribir desde el panel.';
  end if;
  return new;
end;
$$;
create trigger contacts_protect_unsubscribe before update on public.contacts
for each row execute function public.protect_unsubscribe();

-- 4) Estadísticas: series diarias con un solo group by por fuente (no escaneos por día), secciones acotadas,
--    scroll por visitante+pestaña.
create or replace function public.internal_stats(p_days int default 30) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  tz text := 'America/Argentina/Buenos_Aires';
  first_day date := (now() at time zone tz)::date - (greatest(1, least(p_days, 365)) - 1);
  since timestamptz := first_day::timestamp at time zone tz;
  result json;
begin
  if not public.is_admin() then raise exception 'sin acceso'; end if;
  with ev as (select *, (ts at time zone tz)::date as d from public.page_events where ts >= since),
  days as (select generate_series(first_day, (now() at time zone tz)::date, '1 day')::date as d),
  ev_day as (select d, count(*) filter (where type = 'view') views, count(distinct visitor) visitors from ev group by d),
  chat_day as (select (created_at at time zone tz)::date d, count(*) n from public.chat_sessions where created_at >= since group by 1),
  contact_day as (select (created_at at time zone tz)::date d, count(*) n from public.contacts where created_at >= since group by 1),
  maxscroll as (select visitor, sid, max(value) v from ev where type = 'scroll' group by visitor, sid)
  select json_build_object(
    'daily', (select json_agg(json_build_object(
        'd', to_char(days.d, 'YYYY-MM-DD'),
        'views', coalesce(ev_day.views, 0), 'visitors', coalesce(ev_day.visitors, 0),
        'chats', coalesce(chat_day.n, 0), 'contacts', coalesce(contact_day.n, 0)) order by days.d)
      from days left join ev_day on ev_day.d = days.d left join chat_day on chat_day.d = days.d left join contact_day on contact_day.d = days.d),
    'totals', json_build_object(
      'views', (select count(*) from ev where type = 'view'),
      'visitors', (select count(distinct visitor) from ev),
      'chat_open', (select count(distinct visitor) from ev where type = 'chat_open'),
      'chat_msg', (select count(distinct visitor) from ev where type = 'chat_msg'),
      'forms', (select count(*) from ev where type = 'form_submit'),
      'cta', (select count(*) from ev where type = 'cta'),
      'contacts', (select count(*) from public.contacts),
      'contacts_new', (select count(*) from public.contacts where created_at >= since),
      'subscribed', (select count(*) from public.contacts where unsubscribed_at is null),
      'avg_scroll', (select coalesce(round(avg(v)), 0) from maxscroll)
    ),
    'sources', (select coalesce(json_agg(x order by x.visitors desc), '[]') from (
      select source as name, count(distinct visitor) visitors from ev where type = 'view' group by source order by 2 desc limit 8) x),
    'campaigns', (select coalesce(json_agg(x order by x.visitors desc), '[]') from (
      select campaign as name, count(distinct visitor) visitors from ev where type = 'view' and campaign <> '' group by campaign order by 2 desc limit 8) x),
    'devices', (select coalesce(json_agg(x), '[]') from (
      select device as name, count(distinct visitor) visitors from ev where type = 'view' group by device) x),
    'sections', (select coalesce(json_agg(x order by x.visitors desc), '[]') from (
      select section as name, count(distinct visitor) visitors from ev where type = 'section' and section <> '' group by section order by 2 desc limit 12) x),
    'ctas', (select coalesce(json_agg(x order by x.clicks desc), '[]') from (
      select section as name, count(*) clicks from ev where type = 'cta' group by section order by 2 desc limit 8) x),
    'scroll', json_build_object(
      'p25', (select count(*) from maxscroll where v >= 25), 'p50', (select count(*) from maxscroll where v >= 50),
      'p75', (select count(*) from maxscroll where v >= 75), 'p100', (select count(*) from maxscroll where v >= 100)),
    'funnel', json_build_object(
      'visitors', (select count(distinct visitor) from ev),
      'contact_section', (select count(distinct visitor) from ev where type = 'section' and section = 'hablemos'),
      'chat_open', (select count(distinct visitor) from ev where type = 'chat_open'),
      'converted', (select count(distinct visitor) from ev where type in ('chat_msg', 'form_submit')))
  ) into result;
  return result;
end;
$$;

-- 5) Sal propia para el hash de visitantes (no reutiliza el secreto del cron).
alter table public.app_secrets drop constraint app_secrets_name_check;
alter table public.app_secrets add constraint app_secrets_name_check
  check (name in ('telegram_bot_token', 'resend_api_key', 'telegram_webhook_secret', 'cron_secret', 'analytics_salt'));
insert into public.app_secrets (name, value)
values ('analytics_salt', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;
