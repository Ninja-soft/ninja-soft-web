-- PIN por email para retomar el chat en otro navegador (sólo service_role vía chat-resume).
create table public.chat_pins (
  session_id uuid primary key references public.chat_sessions(id) on delete cascade,
  pin_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.chat_pins enable row level security; -- sin políticas

create or replace function public.bump_pin_attempts(p_session uuid) returns void
language sql security definer set search_path = public as $$
  update public.chat_pins set attempts = attempts + 1 where session_id = p_session;
$$;
revoke all on function public.bump_pin_attempts(uuid) from public, anon, authenticated;
