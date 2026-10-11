-- Equipo del panel interno: listado con email y búsqueda por email (sólo service_role, vía admin-settings).
create or replace function public.internal_team()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, confirmed boolean)
language sql stable security definer set search_path = public as $$
  select a.user_id, u.email::text, a.created_at, u.last_sign_in_at, u.encrypted_password is not null and u.encrypted_password <> ''
  from public.internal_admins a join auth.users u on u.id = a.user_id
  order by a.created_at;
$$;

create or replace function public.user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.internal_team() from public, anon, authenticated;
revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
