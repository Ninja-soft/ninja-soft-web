-- Contactos para remarketing, medición de visitas propia y campañas por email.

-- Contactos ------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  phone text,
  company text,
  business text,
  sources text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsub_token uuid not null default gen_random_uuid() unique
);
alter table public.contacts enable row level security;
create policy "admin lee contactos" on public.contacts for select to authenticated using (public.is_admin());
create policy "admin edita contactos" on public.contacts for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Alta o actualización: completa datos vacíos y suma el origen; NUNCA toca la baja.
create or replace function public.upsert_contact(p jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.contacts (email, name, phone, company, business, sources)
  values (
    lower(trim(p->>'email')), coalesce(p->>'name', ''), nullif(p->>'phone', ''), nullif(p->>'company', ''),
    nullif(p->>'business', ''), array[coalesce(p->>'source', 'chat')]
  )
  on conflict (email) do update set
    name = coalesce(nullif(excluded.name, ''), contacts.name),
    phone = coalesce(excluded.phone, contacts.phone),
    company = coalesce(excluded.company, contacts.company),
    business = coalesce(excluded.business, contacts.business),
    sources = (select array_agg(distinct s) from unnest(contacts.sources || excluded.sources) s),
    last_seen_at = now();
$$;
revoke all on function public.upsert_contact(jsonb) from public, anon, authenticated;

-- Backfill con lo que ya existe.
insert into public.contacts (email, name, sources, created_at)
select lower(contact), name, array['chat'], min(created_at) from public.chat_sessions
where contact like '%@%' group by lower(contact), name
on conflict (email) do nothing;
insert into public.contacts (email, name, phone, company, business, sources, created_at)
select distinct on (lower(email)) lower(email), name, phone, company, business, array['form'], created_at
from public.contact_requests order by lower(email), created_at desc
on conflict (email) do update set sources = (select array_agg(distinct s) from unnest(contacts.sources || excluded.sources) s);

-- Eventos de visitas (los inserta la Edge Function track; sin políticas = nadie más los ve) -----------
create table public.page_events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  visitor text not null,
  sid text not null default '',
  type text not null,
  path text not null default '/',
  section text not null default '',
  value int not null default 0,
  source text not null default 'Directo',
  medium text not null default 'directo',
  campaign text not null default '',
  device text not null default 'Computadora'
);
create index page_events_ts on public.page_events (ts);
create index page_events_type_ts on public.page_events (type, ts);
alter table public.page_events enable row level security;

-- Campañas -------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  html text not null,
  status text not null default 'sending' check (status in ('sending', 'done')),
  total int not null default 0,
  sent int not null default 0,
  failed int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create table public.campaign_recipients (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  sent_at timestamptz,
  primary key (campaign_id, contact_id)
);
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
create policy "admin lee campañas" on public.campaigns for select to authenticated using (public.is_admin());
create policy "admin lee destinatarios" on public.campaign_recipients for select to authenticated using (public.is_admin());

-- Estadísticas para /internal (sólo admins) ------------------------------------------------
create or replace function public.internal_stats(p_days int default 30) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires'
                       - make_interval(days => greatest(1, least(p_days, 365)) - 1);
  result json;
begin
  if not public.is_admin() then raise exception 'sin acceso'; end if;
  with ev as (select *, (ts at time zone 'America/Argentina/Buenos_Aires')::date as d from public.page_events where ts >= since),
  days as (select generate_series((since at time zone 'America/Argentina/Buenos_Aires')::date, (now() at time zone 'America/Argentina/Buenos_Aires')::date, '1 day')::date as d),
  maxscroll as (select sid, max(value) v from ev where type = 'scroll' group by sid)
  select json_build_object(
    'daily', (select json_agg(json_build_object(
        'd', to_char(days.d, 'YYYY-MM-DD'),
        'views', (select count(*) from ev where ev.d = days.d and type = 'view'),
        'visitors', (select count(distinct visitor) from ev where ev.d = days.d),
        'chats', (select count(*) from public.chat_sessions s where (s.created_at at time zone 'America/Argentina/Buenos_Aires')::date = days.d),
        'contacts', (select count(*) from public.contacts c where (c.created_at at time zone 'America/Argentina/Buenos_Aires')::date = days.d)
      ) order by days.d) from days),
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
      select section as name, count(distinct visitor) visitors from ev where type = 'section' and section <> '' group by section) x),
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
revoke all on function public.internal_stats(int) from public, anon;
grant execute on function public.internal_stats(int) to authenticated;

-- Retención de eventos: 13 meses.
create or replace function public.purge_old_events() returns void
language sql security definer set search_path = public as $$
  delete from public.page_events where ts < now() - interval '13 months';
$$;
revoke all on function public.purge_old_events() from public, anon, authenticated;
select cron.schedule('purge-old-events', '30 6 * * 0', 'select public.purge_old_events()');
