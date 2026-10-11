-- Campañas en borrador: se guardan, se editan y se borran desde /internal (sólo admins y sólo borradores).
alter table public.campaigns drop constraint campaigns_status_check;
alter table public.campaigns add constraint campaigns_status_check check (status in ('draft', 'sending', 'done'));
alter table public.campaigns add column updated_at timestamptz not null default now();

create policy "admin crea borradores" on public.campaigns
  for insert to authenticated with check (public.is_admin() and status = 'draft');
create policy "admin edita borradores" on public.campaigns
  for update to authenticated using (public.is_admin() and status = 'draft') with check (public.is_admin() and status = 'draft');
create policy "admin borra borradores" on public.campaigns
  for delete to authenticated using (public.is_admin() and status = 'draft');
