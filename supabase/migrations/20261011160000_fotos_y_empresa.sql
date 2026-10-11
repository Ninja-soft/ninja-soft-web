-- Fotos en el chat (ida y vuelta con Telegram) + empresa en el formulario.

-- Mensajes: pueden ser sólo foto (texto vacío).
alter table public.chat_messages add column media_path text;
alter table public.chat_messages drop constraint chat_messages_body_check;
alter table public.chat_messages add constraint chat_messages_body_check
  check (char_length(body) <= 4000 and (char_length(body) >= 1 or media_path is not null));

alter table public.contact_requests add column company text;

-- Bucket privado: carpeta = id de la sesión. Máx. 5 MB, sólo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.owns_chat_folder(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_sessions s
    where s.id::text = (storage.foldername(object_name))[1] and s.user_id = auth.uid() and s.closed_at is null
  );
$$;

create policy "chat-media: visitante ve sus fotos; admin todas" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-media' and (public.owns_chat_folder(name) or public.is_admin()));

create policy "chat-media: visitante sube a su carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-media' and public.owns_chat_folder(name));

-- Aviso a Lucas: fila "Empresa" antes de "Teléfono".
update public.email_templates
set updated_at = now(),
    html = replace(
      html,
      '<tr><td style="padding:6px 20px;font-size:12px;color:#9ca3af">Teléfono</td></tr>',
      '<tr><td style="padding:6px 20px;font-size:12px;color:#9ca3af">Empresa</td></tr>'
      || '<tr><td style="padding:0 20px 12px;font-size:16px;font-weight:600;color:#09051C">{{empresa}}</td></tr>'
      || '<tr><td style="padding:6px 20px;font-size:12px;color:#9ca3af">Teléfono</td></tr>'
    )
where key = 'contact_notify';
