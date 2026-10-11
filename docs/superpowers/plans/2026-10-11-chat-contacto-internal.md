# Chat web → Telegram, contacto con Resend y panel /internal · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar a soft.ninja un chat web que se responde desde Telegram, un formulario de contacto con auto-respuesta de Resend y un panel `/internal` para configurarlo todo.

**Architecture:** El sitio sigue estático (Next.js `output: "export"`). El backend vive en el proyecto Supabase **Ninja Soft Web**: Postgres con RLS, Auth anónimo para visitantes, Realtime para las respuestas y 4 Edge Functions (Deno). La lógica de negocio está en módulos puros de `supabase/functions/_shared/` con dependencias inyectadas, testeados con Vitest desde Node; los `index.ts` de cada función sólo cablean Supabase, Telegram y Resend.

**Tech Stack:** Next.js 14.2 (export estático), TypeScript strict, Tailwind 3.4, `@supabase/supabase-js@2.45.4`, Supabase Edge Functions (Deno), Telegram Bot API, Resend REST API, Vitest 2.1.8, Supabase CLI 2.120.0 vía `npx`.

**Spec:** `docs/superpowers/specs/2026-10-11-chat-contacto-internal-design.md`

## Global Constraints

- Proyecto Supabase: ref `tgaromemhaixgdsdlxiq`, URL `https://tgaromemhaixgdsdlxiq.supabase.co`, región sa-east-1. **Nunca** tocar los proyectos de POS (`hrkditzrsavehnhngakb`) ni Food (`skitcpzszonyybeqymzd`).
- Publishable key (pública): `sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn`.
- Grupo de Telegram: `-1003773063419` ("Ninja Soft Chat Web", Temas activados). Bot `@Ninja_soft_bot`. Token en `%USERPROFILE%\.ninja-telegram-token` (nunca imprimirlo, nunca commitearlo).
- API key de Resend en `%USERPROFILE%\.ninja-resend-key` (la carga Lucas; no commitear).
- Secretos sólo en la tabla `app_secrets` (RLS sin políticas). El navegador nunca recibe un secreto completo: `••••` + últimos 4.
- El sitio sigue con `output: "export"`; nada de API routes de Next.
- Mensaje de chat: 1–2000 caracteres. Nombre 2–80. Contacto: email válido o teléfono con ≥ 6 dígitos (≤ 120).
- Límites: 20 mensajes / 10 min por sesión, 60 / hora por IP; formulario 5 / hora por IP.
- Aviso de espera: `wait_minutes` (default 5). Visitante "ausente": `away_minutes` (default 2) sin latido.
- Variables de plantilla: `{{nombre}}`, `{{email}}`, `{{telefono}}`, `{{rubro}}`, `{{mensaje}}`, `{{respuesta}}`, `{{fecha}}`, `{{link_sitio}}`. Se escapan en HTML; las desconocidas quedan vacías.
- Textos de UI en español rioplatense (vos). Íconos: `@phosphor-icons/react` (cliente) / `@phosphor-icons/react/dist/ssr` (server). Imágenes en WebP.
- Telegram: mandar siempre texto plano (sin `parse_mode`).
- Commits: Conventional Commits, mensaje con `git commit -F archivo` (PowerShell 5.1 rompe comillas). Trabajar en la rama `feature/chat-contacto`.
- Edge Functions se despliegan con `--no-verify-jwt` y validan el usuario adentro.

## Review Focus

1. **Lucas borra un tema en Telegram** y el visitante vuelve a escribir → el mensaje debe llegar igual (se recrea el tema). Test en Task 5.
2. **Texto con `<`, `&`, `*`, `_` o emojis** → Telegram lo recibe tal cual (sin `parse_mode`) y los emails lo escapan. Tests en Tasks 3 y 6.
3. **Lucas escribe en "General", manda un sticker o una foto** → se ignora sin error ni mensaje fantasma. Test en Task 3.
4. **Dominio de Resend sin verificar** (falla el mail al cliente) → el contacto se guarda y a Lucas le llega su aviso. Test en Task 7.
5. **Visitante que dejó teléfono en vez de email** → nunca se intenta mandar la respuesta por email. Test en Task 6.

---

## File Structure

```
supabase/
  config.toml                               (supabase init)
  migrations/20261011120000_chat_contacto.sql   esquema, RLS, RPCs, realtime, semillas
  functions/
    _shared/
      types.ts          tipos + interfaz Store + nombres de secretos/plantillas
      validate.ts       obj(), validaciones de lead/mensaje/contacto, honeypot, maskSecret
      template.ts       escapeHtml, renderTemplate, formatDate, TEMPLATE_VARS
      telegram.ts       topicName, parseAgentUpdate, telegramApi
      resend.ts         resendMailer
      chatSend.ts       handleChatSend (lógica pura)
      webhook.ts        handleTelegramUpdate (lógica pura)
      contact.ts        handleContact (lógica pura)
      http.ts           cors, json, clientIp, sha256, bearer   (Deno/Node neutro)
      supabaseStore.ts  Store sobre supabase-js (sólo Deno)
    chat-send/index.ts
    telegram-webhook/index.ts
    contact-submit/index.ts
    admin-settings/index.ts
scripts/
  sb.mjs               helpers Management API (sql, serviceKey, lit)
  db-apply.mjs         aplica un .sql
  set-secret.mjs       carga un secreto desde archivo
  register-webhook.mjs registra el webhook de Telegram
  create-admin.mjs     crea/actualiza el admin de /internal
  check-rls.mjs        prueba de aislamiento
tests/
  fakes.ts  template.test.ts  validate.test.ts  telegram.test.ts
  chatSend.test.ts  webhook.test.ts  contact.test.ts
lib/
  supabase/client.ts       visitorClient / internalClient
  supabase/functionError.ts
  chat-events.ts           OPEN_CHAT / openChat()
components/
  chat/ChatWidget.tsx  chat/OpenChatButton.tsx
  ContactForm.tsx
  internal/InternalApp.tsx LoginForm.tsx HomeTab.tsx ChatsTab.tsx ContactsTab.tsx SettingsTab.tsx TemplatesTab.tsx
app/internal/layout.tsx  app/internal/page.tsx
```

---

### Task 1: Tooling (Vitest, Supabase CLI, scripts de Management API)

**Files:**
- Modify: `package.json`, `tsconfig.json`
- Create: `vitest.config.ts`, `supabase/config.toml` (vía CLI), `scripts/sb.mjs`, `scripts/db-apply.mjs`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `pnpm test` (Vitest), `node scripts/db-apply.mjs <archivo.sql>`, módulo `scripts/sb.mjs` con `REF`, `SB_URL`, `sql(query)`, `serviceKey()`, `lit(v)`.

- [ ] **Step 1: Rama de trabajo**

```bash
cd /c/Users/Lucas/Documents/ninja-soft-web
git checkout -b feature/chat-contacto
```

- [ ] **Step 2: Dependencias**

```bash
pnpm add @supabase/supabase-js@2.45.4
pnpm add -D vitest@2.1.8
```

- [ ] **Step 3: Script de test en `package.json`** — agregar dentro de `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 5: `tsconfig.json`** — en `compilerOptions` agregar `"allowImportingTsExtensions": true` (los módulos de `_shared` se importan con `.ts`, como pide Deno) y reemplazar `"exclude"` por:

```json
"exclude": ["node_modules", "out", "supabase/functions/*/index.ts", "supabase/functions/_shared/supabaseStore.ts", "supabase/functions/_shared/http.ts"]
```

(Los `index.ts` y `supabaseStore.ts` usan `Deno` y `npm:`; el resto de `_shared` es TypeScript neutro y sí se tipa con `pnpm typecheck`.)

- [ ] **Step 6: Inicializar Supabase**

```bash
npx -y supabase@2.120.0 init
```

Expected: crea `supabase/config.toml`. Si pregunta por VS Code/Deno settings, responder `N`.

- [ ] **Step 7: `scripts/sb.mjs`**

```js
// Helpers para el proyecto Supabase "Ninja Soft Web" vía Management API.
// Requiere SUPABASE_ACCESS_TOKEN en el ambiente.
export const REF = process.env.SB_REF ?? "tgaromemhaixgdsdlxiq";
export const SB_URL = `https://${REF}.supabase.co`;
const API = "https://api.supabase.com/v1";

function token() {
  const t = process.env.SUPABASE_ACCESS_TOKEN;
  if (!t) throw new Error("Falta SUPABASE_ACCESS_TOKEN");
  return t;
}

export async function sql(query) {
  const r = await fetch(`${API}/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text}`);
  return JSON.parse(text);
}

export async function serviceKey() {
  const r = await fetch(`${API}/projects/${REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const keys = await r.json();
  const k = keys.find((x) => x.name === "service_role") ?? keys.find((x) => x.type === "secret");
  if (!k?.api_key) throw new Error("No se encontró la service key");
  return k.api_key;
}

export const lit = (v) => `'${String(v).replaceAll("'", "''")}'`;
```

- [ ] **Step 8: `scripts/db-apply.mjs`**

```js
// Uso: node scripts/db-apply.mjs supabase/migrations/<archivo>.sql
import { readFileSync } from "node:fs";
import { sql, REF } from "./sb.mjs";

const file = process.argv[2];
if (!file) throw new Error("Pasá la ruta del .sql");
await sql(readFileSync(file, "utf8"));
console.log(`OK ${file} → ${REF}`);
```

- [ ] **Step 9: Test de humo** — `tests/smoke.test.ts`:

```ts
import { expect, test } from "vitest";

test("vitest corre", () => {
  expect(1 + 1).toBe(2);
});
```

Run: `pnpm test` → Expected: 1 passed.
Run: `node -e "import('./scripts/sb.mjs').then(m=>m.sql('select 1 as ok')).then(r=>console.log(r))"` → Expected: `[ { ok: 1 } ]`.

- [ ] **Step 10: Typecheck + commit**

Run: `pnpm typecheck` → sin errores.

```bash
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts supabase/config.toml scripts/sb.mjs scripts/db-apply.mjs tests/smoke.test.ts
# mensaje: "chore: vitest, supabase cli y scripts de management api"
git commit -F <archivo-con-mensaje>
```

---

### Task 2: Esquema, RLS, RPCs y semillas

**Files:**
- Create: `supabase/migrations/20261011120000_chat_contacto.sql`

**Interfaces:**
- Produces: tablas `internal_admins`, `chat_sessions`, `chat_messages`, `contact_requests`, `email_templates`, `app_settings`, `app_secrets`, `rate_events`; funciones `is_admin()`, `chat_touch()`, `get_public_config()`; `chat_messages` en la publicación `supabase_realtime`. Claves de `app_settings`: `notify_email`, `sender`, `wait_minutes`, `away_minutes`, `telegram_group_id`, `forms_thread_id`, `site_url`, `pos_internal_url`, `food_internal_url`.

- [ ] **Step 1: Escribir la migración**

```sql
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
```

- [ ] **Step 2: Aplicar**

Run: `node scripts/db-apply.mjs supabase/migrations/20261011120000_chat_contacto.sql`
Expected: `OK supabase/migrations/20261011120000_chat_contacto.sql → tgaromemhaixgdsdlxiq`

- [ ] **Step 3: Habilitar sign-in anónimo**

```bash
curl -s -X PATCH "https://api.supabase.com/v1/projects/tgaromemhaixgdsdlxiq/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"external_anonymous_users_enabled": true}' | python -c "import sys,json;print(json.load(sys.stdin).get('external_anonymous_users_enabled'))"
```

Expected: `True`

- [ ] **Step 4: Verificar**

Run:
```bash
node -e "import('./scripts/sb.mjs').then(async m=>{console.log(await m.sql(\"select count(*)::int n from app_settings\"));console.log(await m.sql(\"select key from email_templates order by key\"));console.log(await m.sql(\"select tablename from pg_publication_tables where pubname='supabase_realtime'\"))})"
```
Expected: `n: 9`; 3 plantillas (`chat_reply`, `contact_ack`, `contact_notify`); `chat_messages` en la publicación.

- [ ] **Step 5: Commit** — `feat(db): esquema de chat, contacto y panel interno`

---

### Task 3: Módulos puros (tipos, validación, plantillas, Telegram, Resend)

**Files:**
- Create: `supabase/functions/_shared/types.ts`, `validate.ts`, `template.ts`, `telegram.ts`, `resend.ts`
- Create: `tests/template.test.ts`, `tests/validate.test.ts`, `tests/telegram.test.ts`
- Delete: `tests/smoke.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `Sender`, `Session`, `Settings`, `Template`, `TemplateKey`, `TEMPLATE_KEYS`, `SecretName`, `SECRET_NAMES`, `EDITABLE_SECRETS`, `MessageInsert`, `ContactInput`, `ContactRecord`, `Store`, `HandlerResult`.
  - `validate.ts`: `obj(v)`, `isEmail(v)`, `isPhone(v)`, `validateLead(raw): Result<Lead>`, `validateMessage(raw): Result<string>`, `validateContact(raw): Result<ContactInput>`, `isHoneypotFilled(raw)`, `maskSecret(v): string | null`.
  - `template.ts`: `TEMPLATE_VARS`, `TemplateData`, `escapeHtml`, `renderTemplate(tpl, data, { html })`, `formatDate(ms)`.
  - `telegram.ts`: `TOPIC_NAME_MAX`, `topicName(name, contact)`, `AgentReply`, `parseAgentUpdate(update, groupId)`, `TelegramApi`, `telegramApi(token, groupId, fetchFn?)`.
  - `resend.ts`: `Mail`, `Mailer`, `resendMailer(apiKey, fetchFn?)`.

- [ ] **Step 1: Tests de plantillas** — `tests/template.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { escapeHtml, renderTemplate } from "../supabase/functions/_shared/template.ts";

describe("renderTemplate", () => {
  test("reemplaza variables con o sin espacios", () => {
    expect(renderTemplate("Hola {{nombre}} / {{ nombre }}", { nombre: "Ana" })).toBe("Hola Ana / Ana");
  });
  test("escapa HTML y convierte saltos de línea", () => {
    expect(renderTemplate("<p>{{mensaje}}</p>", { mensaje: '<b>x</b> & "y"\nz' })).toBe(
      "<p>&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;<br>z</p>",
    );
  });
  test("variables faltantes o desconocidas quedan vacías, nunca 'undefined'", () => {
    expect(renderTemplate("[{{telefono}}][{{foo}}]", {})).toBe("[][]");
  });
  test("modo texto (asunto) no escapa", () => {
    expect(renderTemplate("Nuevo: {{nombre}}", { nombre: "A&B" }, { html: false })).toBe("Nuevo: A&B");
  });
  test("escapeHtml cubre comillas simples", () => {
    expect(escapeHtml("'")).toBe("&#39;");
  });
});
```

- [ ] **Step 2: Tests de validación** — `tests/validate.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  isHoneypotFilled,
  maskSecret,
  validateContact,
  validateLead,
  validateMessage,
} from "../supabase/functions/_shared/validate.ts";

describe("validateLead", () => {
  test("email: recorta y pasa a minúsculas", () => {
    expect(validateLead({ name: "  Ana  Pérez ", contact: " Ana@Mail.COM " })).toEqual({
      ok: true,
      value: { name: "Ana Pérez", contact: "ana@mail.com" },
    });
  });
  test("acepta teléfono argentino con espacios y guiones", () => {
    expect(validateLead({ name: "Juan", contact: "+54 9 341 555-1234" }).ok).toBe(true);
  });
  test("rechaza contacto inválido y nombre corto", () => {
    expect(validateLead({ name: "Juan", contact: "abc" }).ok).toBe(false);
    expect(validateLead({ name: "J", contact: "a@b.co" }).ok).toBe(false);
  });
});

describe("validateMessage", () => {
  test("rechaza vacío, sólo espacios y > 2000", () => {
    expect(validateMessage("").ok).toBe(false);
    expect(validateMessage("   ").ok).toBe(false);
    expect(validateMessage("x".repeat(2001)).ok).toBe(false);
    expect(validateMessage(42).ok).toBe(false);
  });
  test("conserva saltos de línea y emojis", () => {
    expect(validateMessage(" hola\n🔥 ")).toEqual({ ok: true, value: "hola\n🔥" });
  });
});

describe("validateContact", () => {
  const base = { name: "Ana", email: "ana@mail.com", phone: "", business: "Kiosco", message: "Quiero una demo" };
  test("teléfono opcional", () => {
    expect(validateContact(base).ok).toBe(true);
  });
  test("teléfono presente pero inválido se rechaza", () => {
    expect(validateContact({ ...base, phone: "12" }).ok).toBe(false);
  });
  test("email obligatorio y mensaje mínimo", () => {
    expect(validateContact({ ...base, email: "" }).ok).toBe(false);
    expect(validateContact({ ...base, message: "hey" }).ok).toBe(false);
  });
});

test("honeypot", () => {
  expect(isHoneypotFilled({ website: "http://spam" })).toBe(true);
  expect(isHoneypotFilled({ website: "" })).toBe(false);
  expect(isHoneypotFilled(null)).toBe(false);
});

test("maskSecret", () => {
  expect(maskSecret("123456789:AAHxyz9876")).toBe("••••9876");
  expect(maskSecret("short")).toBe("••••");
  expect(maskSecret(null)).toBeNull();
});
```

- [ ] **Step 3: Tests de Telegram** — `tests/telegram.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseAgentUpdate, telegramApi, topicName, TOPIC_NAME_MAX } from "../supabase/functions/_shared/telegram.ts";

const G = "-1003773063419";
const msg = (m: Record<string, unknown>) => ({
  update_id: 1,
  message: {
    message_id: 50,
    chat: { id: Number(G) },
    from: { id: 7, is_bot: false },
    is_topic_message: true,
    message_thread_id: 12,
    text: "Hola, ¿cómo estás?",
    ...m,
  },
});

describe("topicName", () => {
  test("nombre · contacto", () => {
    expect(topicName("Ana", "ana@mail.com")).toBe("Ana · ana@mail.com");
  });
  test("recorta a 128 caracteres reales (emojis incluidos)", () => {
    const t = topicName("🔥".repeat(100), "x".repeat(100));
    expect([...t].length).toBe(TOPIC_NAME_MAX);
    expect(t.endsWith("…")).toBe(true);
  });
});

describe("parseAgentUpdate", () => {
  test("respuesta humana dentro de un tema", () => {
    expect(parseAgentUpdate(msg({}), G)).toEqual({ threadId: 12, text: "Hola, ¿cómo estás?", messageId: 50 });
  });
  test("ignora otro chat, bots, General, stickers/fotos y updates raros", () => {
    expect(parseAgentUpdate(msg({ chat: { id: 1 } }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ from: { id: 9, is_bot: true } }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ is_topic_message: undefined, message_thread_id: undefined }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ text: undefined, sticker: { file_id: "x" } }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ text: "   " }), G)).toBeNull();
    expect(parseAgentUpdate({ update_id: 2, edited_message: {} }, G)).toBeNull();
    expect(parseAgentUpdate(null, G)).toBeNull();
  });
});

describe("telegramApi", () => {
  test("manda texto plano (sin parse_mode) al tema", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ ok: true, result: { message_id: 99 } }));
    }) as unknown as typeof fetch;
    const id = await telegramApi("t", G, fakeFetch).send(12, "<b>*hola*_</b> & 🔥");
    expect(id).toBe(99);
    expect(bodies[0]).toEqual({ chat_id: G, text: "<b>*hola*_</b> & 🔥", message_thread_id: 12 });
    expect("parse_mode" in bodies[0]).toBe(false);
  });
  test("si Telegram responde ok:false, lanza error", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ ok: false, description: "Bad Request: message thread not found" }))) as unknown as typeof fetch;
    await expect(telegramApi("t", G, fakeFetch).send(12, "x")).rejects.toThrow("message thread not found");
  });
});
```

- [ ] **Step 4: Correr y ver fallar**

Run: `rm tests/smoke.test.ts && pnpm test`
Expected: FAIL — módulos `_shared/*` no existen.

- [ ] **Step 5: `supabase/functions/_shared/types.ts`**

```ts
// Tipos compartidos entre Edge Functions y tests.
export type Sender = "visitor" | "agent" | "system";

export type Session = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  telegram_thread_id: number | null;
  last_seen_at: string;
};

export type Settings = Record<string, string>;

export const TEMPLATE_KEYS = ["contact_ack", "contact_notify", "chat_reply"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type Template = { subject: string; html: string };

export const SECRET_NAMES = ["telegram_bot_token", "resend_api_key", "telegram_webhook_secret"] as const;
export type SecretName = (typeof SECRET_NAMES)[number];
export const EDITABLE_SECRETS: readonly SecretName[] = ["telegram_bot_token", "resend_api_key"];

export type MessageInsert = {
  session_id: string;
  sender: Sender;
  body: string;
  telegram_message_id?: number | null;
};

export type ContactInput = { name: string; email: string; phone: string; business: string; message: string };
export type ContactRecord = ContactInput & { ip_hash: string };

export type HandlerResult = { status: number; json: Record<string, unknown> };

// Acceso a datos. En producción lo implementa supabaseStore.ts; en tests, FakeStore.
export interface Store {
  settings(): Promise<Settings>;
  secret(name: SecretName): Promise<string | null>;
  sessionForUser(userId: string): Promise<Session | null>;
  sessionByThread(threadId: number): Promise<Session | null>;
  createSession(userId: string, name: string, contact: string): Promise<Session>;
  setThread(sessionId: string, threadId: number): Promise<void>;
  addMessage(m: MessageInsert): Promise<{ id: string }>;
  markEmailed(messageId: string): Promise<void>;
  countRecent(bucket: string, windowMs: number): Promise<number>;
  hit(bucket: string): Promise<void>;
  template(key: TemplateKey): Promise<Template | null>;
  saveContact(c: ContactRecord): Promise<{ id: string }>;
  setSetting(key: string, value: string): Promise<void>;
}
```

- [ ] **Step 6: `supabase/functions/_shared/validate.ts`**

```ts
import type { ContactInput } from "./types.ts";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type Lead = { name: string; contact: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s\-().]{6,20}$/;

export function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

// Texto de una línea: recorta, colapsa espacios y limita largo.
const line = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export const isEmail = (v: string) => EMAIL.test(v);
export const isPhone = (v: string) => PHONE.test(v) && v.replace(/\D/g, "").length >= 6;

export function validateLead(raw: unknown): Result<Lead> {
  const o = obj(raw);
  const name = line(o.name, 80);
  const c = line(o.contact, 120);
  if (name.length < 2) return { ok: false, error: "Ingresá tu nombre." };
  const contact = isEmail(c) ? c.toLowerCase() : c;
  if (!isEmail(contact) && !isPhone(contact)) return { ok: false, error: "Ingresá un email o teléfono válido." };
  return { ok: true, value: { name, contact } };
}

export function validateMessage(raw: unknown): Result<string> {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: "Escribí un mensaje." };
  const t = raw.trim();
  if (t.length > 2000) return { ok: false, error: "El mensaje es demasiado largo (máx. 2000 caracteres)." };
  return { ok: true, value: t };
}

export function validateContact(raw: unknown): Result<ContactInput> {
  const o = obj(raw);
  const name = line(o.name, 80);
  const email = line(o.email, 120).toLowerCase();
  const phone = line(o.phone, 30);
  const business = line(o.business, 60);
  const message = typeof o.message === "string" ? o.message.trim().slice(0, 4000) : "";
  if (name.length < 2) return { ok: false, error: "Ingresá tu nombre." };
  if (!isEmail(email)) return { ok: false, error: "Ingresá un email válido." };
  if (phone && !isPhone(phone)) return { ok: false, error: "El teléfono no parece válido." };
  if (message.length < 5) return { ok: false, error: "Contanos un poco más en el mensaje." };
  return { ok: true, value: { name, email, phone, business, message } };
}

// Campo oculto "website": sólo lo completan los bots.
export const isHoneypotFilled = (raw: unknown) => {
  const w = obj(raw).website;
  return typeof w === "string" && w.trim() !== "";
};

export function maskSecret(v: string | null): string | null {
  if (!v) return null;
  return v.length < 8 ? "••••" : `••••${v.slice(-4)}`;
}
```

- [ ] **Step 7: `supabase/functions/_shared/template.ts`**

```ts
// Plantillas de email: {{variable}} con escape HTML.
export const TEMPLATE_VARS = [
  "nombre",
  "email",
  "telefono",
  "rubro",
  "mensaje",
  "respuesta",
  "fecha",
  "link_sitio",
] as const;
export type TemplateVar = (typeof TEMPLATE_VARS)[number];
export type TemplateData = Partial<Record<TemplateVar, string>>;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTemplate(tpl: string, data: TemplateData, opts: { html: boolean } = { html: true }): string {
  const values = data as Record<string, string | undefined>;
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, key: string) => {
    const v = values[key] ?? "";
    return opts.html ? escapeHtml(v).replace(/\r?\n/g, "<br>") : v;
  });
}

export function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(ms));
}
```

- [ ] **Step 8: `supabase/functions/_shared/telegram.ts`**

```ts
import { obj } from "./validate.ts";

export const TOPIC_NAME_MAX = 128;

export function topicName(name: string, contact: string): string {
  const chars = [...`${name} · ${contact}`];
  return chars.length > TOPIC_NAME_MAX ? chars.slice(0, TOPIC_NAME_MAX - 1).join("") + "…" : chars.join("");
}

export type AgentReply = { threadId: number; text: string; messageId: number };

// Sólo cuenta como respuesta un texto de una persona, dentro de un tema del grupo configurado.
export function parseAgentUpdate(update: unknown, groupId: string): AgentReply | null {
  const m = obj(obj(update).message);
  if (!Object.keys(m).length) return null;
  if (String(obj(m.chat).id) !== groupId) return null;
  if (obj(m.from).is_bot === true) return null;
  if (m.is_topic_message !== true || typeof m.message_thread_id !== "number") return null;
  if (typeof m.text !== "string" || !m.text.trim()) return null;
  return { threadId: m.message_thread_id, text: m.text.trim(), messageId: Number(m.message_id) };
}

export type TelegramApi = {
  createTopic(name: string): Promise<number>;
  send(threadId: number | null, text: string): Promise<number>;
};

export function telegramApi(token: string, groupId: string, fetchFn: typeof fetch = fetch): TelegramApi {
  async function call(method: string, payload: Record<string, unknown>) {
    const r = await fetchFn(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = obj(await r.json());
    if (data.ok !== true) throw new Error(`Telegram ${method}: ${String(data.description ?? r.status)}`);
    return obj(data.result);
  }
  return {
    async createTopic(name) {
      return Number((await call("createForumTopic", { chat_id: groupId, name })).message_thread_id);
    },
    // Texto plano a propósito: sin parse_mode, nada del visitante se interpreta.
    async send(threadId, text) {
      const payload: Record<string, unknown> = { chat_id: groupId, text };
      if (threadId) payload.message_thread_id = threadId;
      return Number((await call("sendMessage", payload)).message_id);
    },
  };
}
```

- [ ] **Step 9: `supabase/functions/_shared/resend.ts`**

```ts
export type Mail = { from: string; to: string; subject: string; html: string; replyTo?: string };
export type Mailer = (m: Mail) => Promise<void>;

export function resendMailer(apiKey: string, fetchFn: typeof fetch = fetch): Mailer {
  return async (m) => {
    const r = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: m.from, to: [m.to], subject: m.subject, html: m.html, reply_to: m.replyTo }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  };
}
```

- [ ] **Step 10: Correr tests**

Run: `pnpm test` → Expected: todos PASS. Run: `pnpm typecheck` → sin errores.

- [ ] **Step 11: Commit** — `feat(chat): modulos de validacion, plantillas, telegram y resend`

---

### Task 4: Fakes de test

**Files:**
- Create: `tests/fakes.ts`

**Interfaces:**
- Consumes: `Store`, `Session`, `Settings`, `Template`, `TemplateKey`, `SecretName`, `MessageInsert`, `ContactRecord` (Task 3), `TelegramApi`, `Mail`, `Mailer`.
- Produces: `class FakeStore implements Store` (campos públicos `sessions`, `messages`, `contacts`, `hits`, `emailed`, `cfg`, `secrets`, `templates`), `fakeTelegram(opts?)` → `{ api, calls, factory }`, `fakeMailer(opts?)` → `{ sent, factory }`, `TEMPLATES` de prueba.

- [ ] **Step 1: Escribir `tests/fakes.ts`**

```ts
import type { Mail, Mailer } from "../supabase/functions/_shared/resend.ts";
import type { TelegramApi } from "../supabase/functions/_shared/telegram.ts";
import type {
  ContactRecord,
  MessageInsert,
  SecretName,
  Session,
  Settings,
  Store,
  Template,
  TemplateKey,
} from "../supabase/functions/_shared/types.ts";

export const TEMPLATES: Record<TemplateKey, Template> = {
  contact_ack: { subject: "Gracias {{nombre}}", html: "<p>{{mensaje}}</p>" },
  contact_notify: { subject: "Nuevo: {{nombre}}", html: "<p>{{nombre}} {{email}} {{mensaje}}</p>" },
  chat_reply: { subject: "Te respondimos", html: "<p>{{respuesta}}</p>" },
};

export class FakeStore implements Store {
  sessions: Session[] = [];
  messages: (MessageInsert & { id: string })[] = [];
  contacts: ContactRecord[] = [];
  hits: { bucket: string; at: number }[] = [];
  emailed: string[] = [];

  constructor(
    public cfg: Settings = {},
    public secrets: Partial<Record<SecretName, string>> = {},
    public templates: Partial<Record<TemplateKey, Template>> = TEMPLATES,
  ) {}

  async settings() {
    return { ...this.cfg };
  }
  async secret(name: SecretName) {
    return this.secrets[name] ?? null;
  }
  async sessionForUser(userId: string) {
    return this.sessions.find((s) => s.user_id === userId) ?? null;
  }
  async sessionByThread(threadId: number) {
    return this.sessions.find((s) => s.telegram_thread_id === threadId) ?? null;
  }
  async createSession(user_id: string, name: string, contact: string) {
    const s: Session = {
      id: `s${this.sessions.length + 1}`,
      user_id,
      name,
      contact,
      telegram_thread_id: null,
      last_seen_at: new Date().toISOString(),
    };
    this.sessions.push(s);
    return s;
  }
  async setThread(sessionId: string, threadId: number) {
    const s = this.sessions.find((x) => x.id === sessionId);
    if (s) s.telegram_thread_id = threadId;
  }
  async addMessage(m: MessageInsert) {
    const row = { ...m, id: `m${this.messages.length + 1}` };
    this.messages.push(row);
    return { id: row.id };
  }
  async markEmailed(id: string) {
    this.emailed.push(id);
  }
  async countRecent(bucket: string, windowMs: number) {
    const since = Date.now() - windowMs;
    return this.hits.filter((h) => h.bucket === bucket && h.at >= since).length;
  }
  async hit(bucket: string) {
    this.hits.push({ bucket, at: Date.now() });
  }
  async template(key: TemplateKey) {
    return this.templates[key] ?? null;
  }
  async saveContact(c: ContactRecord) {
    this.contacts.push(c);
    return { id: `c${this.contacts.length}` };
  }
  async setSetting(key: string, value: string) {
    this.cfg[key] = value;
  }
}

export function fakeTelegram(opts: { failSendOnce?: boolean } = {}) {
  const calls = { topics: [] as string[], sent: [] as { threadId: number | null; text: string }[] };
  let fail = !!opts.failSendOnce;
  let next = 100;
  const api: TelegramApi = {
    async createTopic(name) {
      calls.topics.push(name);
      return ++next;
    },
    async send(threadId, text) {
      if (fail) {
        fail = false;
        throw new Error("Telegram sendMessage: Bad Request: message thread not found");
      }
      calls.sent.push({ threadId, text });
      return calls.sent.length;
    },
  };
  return { api, calls, factory: (_token: string, _group: string) => api };
}

export function fakeMailer(opts: { failTo?: string } = {}) {
  const sent: Mail[] = [];
  const factory = (_apiKey: string): Mailer => async (m) => {
    if (opts.failTo && m.to === opts.failTo) throw new Error("Resend 403: domain not verified");
    sent.push(m);
  };
  return { sent, factory };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck` → sin errores.

- [ ] **Step 3: Commit** — `test(chat): fakes de store, telegram y mailer`

---

### Task 5: `chat-send` (lógica + Edge Function + deploy + RLS)

**Files:**
- Create: `supabase/functions/_shared/chatSend.ts`, `supabase/functions/_shared/http.ts`, `supabase/functions/_shared/supabaseStore.ts`, `supabase/functions/chat-send/index.ts`, `tests/chatSend.test.ts`, `scripts/check-rls.mjs`

**Interfaces:**
- Consumes: Task 3 (`validate`, `telegram`, `types`), Task 4 (fakes).
- Produces:
  - `handleChatSend(deps: ChatDeps, input: { userId: string; ip: string; body: unknown }): Promise<HandlerResult>`; `ChatDeps = { store: Store; telegram: (token: string, groupId: string) => TelegramApi }`; `LIMITS`.
  - Respuesta 200: `{ ok: true, id, sessionId, delivered }`. Errores: `{ error: string }` con 400/401/429.
  - `http.ts`: `cors`, `json(status, body)`, `clientIp(req)`, `sha256(s)`, `bearer(req)`.
  - `supabaseStore.ts`: `adminClient()`, `supabaseStore(db): Store`.

- [ ] **Step 1: Tests** — `tests/chatSend.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { handleChatSend, LIMITS } from "../supabase/functions/_shared/chatSend.ts";
import { FakeStore, fakeTelegram } from "./fakes.ts";

const CFG = { telegram_group_id: "-100" };
const lead = { name: "Ana", contact: "ana@mail.com" };
let store: FakeStore;

beforeEach(() => {
  store = new FakeStore({ ...CFG }, { telegram_bot_token: "123:abc" });
});

describe("handleChatSend", () => {
  test("primer mensaje sin nombre/contacto → 400 y no guarda nada", async () => {
    const tg = fakeTelegram();
    const r = await handleChatSend({ store, telegram: tg.factory }, { userId: "u1", ip: "ip", body: { message: "hola" } });
    expect(r.status).toBe(400);
    expect(store.messages).toHaveLength(0);
  });

  test("primer mensaje: crea sesión, tema y lo reenvía", async () => {
    const tg = fakeTelegram();
    const r = await handleChatSend(
      { store, telegram: tg.factory },
      { userId: "u1", ip: "ip", body: { ...lead, message: "hola" } },
    );
    expect(r).toEqual({ status: 200, json: { ok: true, id: "m1", sessionId: "s1", delivered: true } });
    expect(tg.calls.topics).toEqual(["Ana · ana@mail.com"]);
    expect(tg.calls.sent).toEqual([{ threadId: 101, text: "hola" }]);
    expect(store.sessions[0].telegram_thread_id).toBe(101);
  });

  test("segundo mensaje reutiliza el tema", async () => {
    const tg = fakeTelegram();
    const deps = { store, telegram: tg.factory };
    await handleChatSend(deps, { userId: "u1", ip: "ip", body: { ...lead, message: "uno" } });
    await handleChatSend(deps, { userId: "u1", ip: "ip", body: { message: "dos" } });
    expect(tg.calls.topics).toHaveLength(1);
    expect(tg.calls.sent.map((s) => s.threadId)).toEqual([101, 101]);
  });

  test("Lucas borró el tema: lo recrea y el mensaje llega", async () => {
    const first = fakeTelegram();
    await handleChatSend({ store, telegram: first.factory }, { userId: "u1", ip: "ip", body: { ...lead, message: "uno" } });
    const tg = fakeTelegram({ failSendOnce: true });
    const r = await handleChatSend({ store, telegram: tg.factory }, { userId: "u1", ip: "ip", body: { message: "dos" } });
    expect(r.json.delivered).toBe(true);
    expect(tg.calls.topics).toEqual(["Ana · ana@mail.com"]);
    expect(tg.calls.sent).toEqual([{ threadId: 101, text: "dos" }]);
    expect(store.sessions[0].telegram_thread_id).toBe(101);
  });

  test("sin token de Telegram: guarda igual y avisa delivered:false", async () => {
    store.secrets = {};
    const tg = fakeTelegram();
    const r = await handleChatSend({ store, telegram: tg.factory }, { userId: "u1", ip: "ip", body: { ...lead, message: "hola" } });
    expect(r.status).toBe(200);
    expect(r.json.delivered).toBe(false);
    expect(store.messages).toHaveLength(1);
  });

  test("límite por sesión → 429", async () => {
    const tg = fakeTelegram();
    const deps = { store, telegram: tg.factory };
    await handleChatSend(deps, { userId: "u1", ip: "ip", body: { ...lead, message: "0" } });
    for (let i = 1; i < LIMITS.perSession; i++) await handleChatSend(deps, { userId: "u1", ip: "ip", body: { message: String(i) } });
    const r = await handleChatSend(deps, { userId: "u1", ip: "ip", body: { message: "uno más" } });
    expect(r.status).toBe(429);
    expect(store.messages).toHaveLength(LIMITS.perSession);
  });

  test("honeypot: responde ok pero no guarda ni reenvía", async () => {
    const tg = fakeTelegram();
    const r = await handleChatSend(
      { store, telegram: tg.factory },
      { userId: "u1", ip: "ip", body: { ...lead, message: "spam", website: "x" } },
    );
    expect(r.status).toBe(200);
    expect(store.messages).toHaveLength(0);
    expect(tg.calls.sent).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Ver fallar** — Run: `pnpm test tests/chatSend.test.ts` → FAIL (no existe `chatSend.ts`).

- [ ] **Step 3: `supabase/functions/_shared/chatSend.ts`**

```ts
import { topicName, type TelegramApi } from "./telegram.ts";
import type { HandlerResult, Session, Store } from "./types.ts";
import { isHoneypotFilled, obj, validateLead, validateMessage } from "./validate.ts";

export const LIMITS = { perSession: 20, sessionWindowMs: 10 * 60_000, perIp: 60, ipWindowMs: 60 * 60_000 };

export type ChatDeps = { store: Store; telegram: (token: string, groupId: string) => TelegramApi };

export async function handleChatSend(
  deps: ChatDeps,
  input: { userId: string; ip: string; body: unknown },
): Promise<HandlerResult> {
  const { store } = deps;
  const o = obj(input.body);
  if (isHoneypotFilled(o)) return { status: 200, json: { ok: true } };

  const msg = validateMessage(o.message);
  if (!msg.ok) return { status: 400, json: { error: msg.error } };

  let session = await store.sessionForUser(input.userId);
  if (!session) {
    const lead = validateLead(o);
    if (!lead.ok) return { status: 400, json: { error: lead.error } };
    session = await store.createSession(input.userId, lead.value.name, lead.value.contact);
  }

  const sKey = `chat:s:${session.id}`;
  const ipKey = `chat:ip:${input.ip}`;
  if (
    (await store.countRecent(sKey, LIMITS.sessionWindowMs)) >= LIMITS.perSession ||
    (await store.countRecent(ipKey, LIMITS.ipWindowMs)) >= LIMITS.perIp
  ) {
    return { status: 429, json: { error: "Demasiados mensajes seguidos. Probá en unos minutos." } };
  }
  await store.hit(sKey);
  await store.hit(ipKey);

  const saved = await store.addMessage({ session_id: session.id, sender: "visitor", body: msg.value });
  const delivered = await forward(deps, session, msg.value);
  return { status: 200, json: { ok: true, id: saved.id, sessionId: session.id, delivered } };
}

// Reenvía a Telegram. Si el tema ya no existe (Lucas lo borró), crea uno nuevo y reintenta una vez.
async function forward(deps: ChatDeps, session: Session, text: string): Promise<boolean> {
  try {
    const token = await deps.store.secret("telegram_bot_token");
    const groupId = (await deps.store.settings()).telegram_group_id;
    if (!token || !groupId) return false;
    const tg = deps.telegram(token, groupId);
    const newTopic = async () => {
      const id = await tg.createTopic(topicName(session.name, session.contact));
      await deps.store.setThread(session.id, id);
      return id;
    };
    const thread = session.telegram_thread_id ?? (await newTopic());
    try {
      await tg.send(thread, text);
    } catch (err) {
      if (session.telegram_thread_id == null) throw err;
      await tg.send(await newTopic(), text);
    }
    return true;
  } catch (err) {
    console.error("chat-send: telegram", err);
    return false;
  }
}
```

- [ ] **Step 4: Pasar tests** — Run: `pnpm test` → PASS. Run: `pnpm typecheck` → sin errores.

- [ ] **Step 5: `supabase/functions/_shared/http.ts`**

```ts
export const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";

export const bearer = (req: Request) => (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

export async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

- [ ] **Step 6: `supabase/functions/_shared/supabaseStore.ts`**

```ts
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import type { Session, Store, Template } from "./types.ts";

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const SESSION_COLS = "id,user_id,name,contact,telegram_thread_id,last_seen_at";

// deno-lint-ignore no-explicit-any
function must(r: { data: any; error: { message: string } | null }) {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function supabaseStore(db: SupabaseClient): Store {
  return {
    async settings() {
      const rows: { key: string; value: string }[] = must(await db.from("app_settings").select("key,value"));
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
    async secret(name) {
      const r = must(await db.from("app_secrets").select("value").eq("name", name).maybeSingle());
      return r?.value || null;
    },
    async sessionForUser(userId) {
      return must(
        await db.from("chat_sessions").select(SESSION_COLS).eq("user_id", userId).is("closed_at", null).maybeSingle(),
      ) as Session | null;
    },
    async sessionByThread(threadId) {
      return must(await db.from("chat_sessions").select(SESSION_COLS).eq("telegram_thread_id", threadId).maybeSingle()) as
        | Session
        | null;
    },
    async createSession(userId, name, contact) {
      return must(
        await db.from("chat_sessions").insert({ user_id: userId, name, contact }).select(SESSION_COLS).single(),
      ) as Session;
    },
    async setThread(sessionId, threadId) {
      must(await db.from("chat_sessions").update({ telegram_thread_id: threadId }).eq("id", sessionId));
    },
    async addMessage(m) {
      return must(await db.from("chat_messages").insert(m).select("id").single());
    },
    async markEmailed(id) {
      must(await db.from("chat_messages").update({ emailed_at: new Date().toISOString() }).eq("id", id));
    },
    async countRecent(bucket, windowMs) {
      const since = new Date(Date.now() - windowMs).toISOString();
      const { count, error } = await db
        .from("rate_events")
        .select("id", { count: "exact", head: true })
        .eq("bucket", bucket)
        .gte("created_at", since);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async hit(bucket) {
      must(await db.from("rate_events").insert({ bucket }));
      // limpieza ocasional de eventos viejos
      if (Math.random() < 0.05) {
        await db.from("rate_events").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
      }
    },
    async template(key) {
      return must(await db.from("email_templates").select("subject,html").eq("key", key).maybeSingle()) as Template | null;
    },
    async saveContact(c) {
      return must(
        await db
          .from("contact_requests")
          .insert({
            name: c.name,
            email: c.email,
            phone: c.phone || null,
            business: c.business || null,
            message: c.message,
            ip_hash: c.ip_hash,
          })
          .select("id")
          .single(),
      );
    },
    async setSetting(key, value) {
      must(await db.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }));
    },
  };
}
```

- [ ] **Step 7: `supabase/functions/chat-send/index.ts`**

```ts
import { handleChatSend } from "../_shared/chatSend.ts";
import { bearer, clientIp, cors, json, sha256 } from "../_shared/http.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { telegramApi } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const db = adminClient();
    const { data, error } = await db.auth.getUser(bearer(req));
    if (error || !data.user) return json(401, { error: "Sesión inválida. Recargá la página." });
    const body = await req.json().catch(() => null);
    const r = await handleChatSend(
      { store: supabaseStore(db), telegram: (t, g) => telegramApi(t, g) },
      { userId: data.user.id, ip: await sha256(clientIp(req)), body },
    );
    return json(r.status, r.json);
  } catch (err) {
    console.error("chat-send", err);
    return json(500, { error: "No pudimos enviar tu mensaje. Probá de nuevo." });
  }
});
```

- [ ] **Step 8: Deploy**

Run: `npx -y supabase@2.120.0 functions deploy chat-send --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api`
Expected: `Deployed Functions on project tgaromemhaixgdsdlxiq: chat-send`

- [ ] **Step 9: `scripts/check-rls.mjs`** (corre ANTES de cargar el token de Telegram, para no crear temas de prueba)

```js
// Prueba de aislamiento: un visitante no ve chats ajenos; anónimos no leen secretos ni plantillas.
import { createClient } from "@supabase/supabase-js";
import { SB_URL, sql } from "./sb.mjs";

const KEY = "sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn";
const mk = () => createClient(SB_URL, KEY, { auth: { persistSession: false } });
let fails = 0;
const check = (ok, label) => {
  console.log(ok ? "OK   " : "FALLA", label);
  if (!ok) fails++;
};

const a = mk();
await a.auth.signInAnonymously();
const sent = await a.functions.invoke("chat-send", { body: { name: "RLS Test", contact: "rls@test.com", message: "hola rls" } });
check(sent.data?.ok === true, "A puede escribir");
const mineA = await a.from("chat_messages").select("id");
check(mineA.data?.length === 1, "A ve su mensaje");

const b = mk();
await b.auth.signInAnonymously();
const sessB = await b.from("chat_sessions").select("id");
const msgB = await b.from("chat_messages").select("id");
check(sessB.data?.length === 0 && msgB.data?.length === 0, "B no ve el chat de A");
for (const t of ["app_secrets", "email_templates", "app_settings", "contact_requests", "rate_events"]) {
  const r = await b.from(t).select("*");
  check((r.data?.length ?? 0) === 0, `B no lee ${t}`);
}
const ins = await b.from("chat_messages").insert({ session_id: sessB.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000000", sender: "agent", body: "x" });
check(!!ins.error, "B no puede insertar mensajes directo");

await sql("delete from auth.users where id in (select user_id from chat_sessions where name = 'RLS Test')");
await sql("delete from auth.users where is_anonymous and id not in (select user_id from chat_sessions)");
console.log(fails ? `${fails} fallas` : "RLS OK");
process.exit(fails ? 1 : 0);
```

Run: `node scripts/check-rls.mjs` → Expected: todas `OK`, última línea `RLS OK`.

- [ ] **Step 10: Commit** — `feat(chat): edge function chat-send con limites y reenvio a telegram`

---

### Task 6: `telegram-webhook` (respuestas de Lucas → chat / email)

**Files:**
- Create: `supabase/functions/_shared/webhook.ts`, `supabase/functions/telegram-webhook/index.ts`, `tests/webhook.test.ts`

**Interfaces:**
- Consumes: `parseAgentUpdate`, `renderTemplate`, `formatDate`, `isEmail`, `Mailer`, `Store`, fakes.
- Produces: `handleTelegramUpdate(deps: WebhookDeps, update: unknown, now?: number): Promise<{ handled: boolean; emailed: boolean }>`; `WebhookDeps = { store: Store; mailer: (apiKey: string) => Mailer }`.

- [ ] **Step 1: Tests** — `tests/webhook.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { handleTelegramUpdate } from "../supabase/functions/_shared/webhook.ts";
import { FakeStore, fakeMailer } from "./fakes.ts";

const G = "-100";
const update = (threadId: number, text: string) => ({
  update_id: 1,
  message: { message_id: 7, chat: { id: -100 }, from: { id: 1, is_bot: false }, is_topic_message: true, message_thread_id: threadId, text },
});
const CFG = { telegram_group_id: G, away_minutes: "2", sender: "Ninja <a@b.co>", notify_email: "lucas@x.com", site_url: "https://s" };
let store: FakeStore;

beforeEach(async () => {
  store = new FakeStore({ ...CFG }, { resend_api_key: "re_1" });
  const s = await store.createSession("u1", "Ana", "ana@mail.com");
  await store.setThread(s.id, 55);
});

describe("handleTelegramUpdate", () => {
  test("respuesta en un tema conocido → mensaje del agente", async () => {
    const m = fakeMailer();
    const r = await handleTelegramUpdate({ store, mailer: m.factory }, update(55, "Hola Ana"));
    expect(r.handled).toBe(true);
    expect(store.messages).toEqual([{ id: "m1", session_id: "s1", sender: "agent", body: "Hola Ana", telegram_message_id: 7 }]);
  });

  test("tema desconocido → se ignora", async () => {
    const r = await handleTelegramUpdate({ store, mailer: fakeMailer().factory }, update(999, "x"));
    expect(r.handled).toBe(false);
    expect(store.messages).toHaveLength(0);
  });

  test("visitante presente → no se manda email", async () => {
    const m = fakeMailer();
    const r = await handleTelegramUpdate({ store, mailer: m.factory }, update(55, "Hola"), Date.now());
    expect(r.emailed).toBe(false);
    expect(m.sent).toHaveLength(0);
  });

  test("visitante ausente con email → email escapado y marcado", async () => {
    const m = fakeMailer();
    const later = Date.now() + 5 * 60_000;
    const r = await handleTelegramUpdate({ store, mailer: m.factory }, update(55, "<script>&"), later);
    expect(r.emailed).toBe(true);
    expect(m.sent[0]).toMatchObject({ to: "ana@mail.com", from: "Ninja <a@b.co>", replyTo: "lucas@x.com" });
    expect(m.sent[0].html).toBe("<p>&lt;script&gt;&amp;</p>");
    expect(store.emailed).toEqual(["m1"]);
  });

  test("visitante ausente que dejó teléfono → nunca se intenta email", async () => {
    store.sessions[0].contact = "+54 9 341 555 1234";
    const m = fakeMailer();
    const r = await handleTelegramUpdate({ store, mailer: m.factory }, update(55, "Hola"), Date.now() + 10 * 60_000);
    expect(r.emailed).toBe(false);
    expect(m.sent).toHaveLength(0);
  });

  test("falla de Resend no rompe: el mensaje queda guardado", async () => {
    const m = fakeMailer({ failTo: "ana@mail.com" });
    const r = await handleTelegramUpdate({ store, mailer: m.factory }, update(55, "Hola"), Date.now() + 10 * 60_000);
    expect(r).toEqual({ handled: true, emailed: false });
    expect(store.messages).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Ver fallar** — Run: `pnpm test tests/webhook.test.ts` → FAIL.

- [ ] **Step 3: `supabase/functions/_shared/webhook.ts`**

```ts
import type { Mailer } from "./resend.ts";
import { parseAgentUpdate } from "./telegram.ts";
import { formatDate, renderTemplate } from "./template.ts";
import type { Store } from "./types.ts";
import { isEmail } from "./validate.ts";

export type WebhookDeps = { store: Store; mailer: (apiKey: string) => Mailer };

export async function handleTelegramUpdate(
  deps: WebhookDeps,
  update: unknown,
  now = Date.now(),
): Promise<{ handled: boolean; emailed: boolean }> {
  const { store } = deps;
  const s = await store.settings();
  const reply = parseAgentUpdate(update, s.telegram_group_id ?? "");
  if (!reply) return { handled: false, emailed: false };
  const session = await store.sessionByThread(reply.threadId);
  if (!session) return { handled: false, emailed: false };

  const saved = await store.addMessage({
    session_id: session.id,
    sender: "agent",
    body: reply.text,
    telegram_message_id: reply.messageId,
  });

  // Si el visitante no está en la página, la respuesta también le llega por email.
  const awayMs = (Number(s.away_minutes) || 2) * 60_000;
  const away = now - Date.parse(session.last_seen_at) > awayMs;
  if (!away || !isEmail(session.contact)) return { handled: true, emailed: false };
  try {
    const key = await store.secret("resend_api_key");
    const tpl = await store.template("chat_reply");
    if (!key || !tpl || !s.sender) return { handled: true, emailed: false };
    const data = {
      nombre: session.name,
      email: session.contact,
      respuesta: reply.text,
      fecha: formatDate(now),
      link_sitio: s.site_url,
    };
    await deps.mailer(key)({
      from: s.sender,
      to: session.contact,
      subject: renderTemplate(tpl.subject, data, { html: false }),
      html: renderTemplate(tpl.html, data),
      replyTo: s.notify_email || undefined,
    });
    await store.markEmailed(saved.id);
    return { handled: true, emailed: true };
  } catch (err) {
    console.error("telegram-webhook: email", err);
    return { handled: true, emailed: false };
  }
}
```

- [ ] **Step 4: Pasar tests** — Run: `pnpm test` → PASS. `pnpm typecheck` → OK.

- [ ] **Step 5: `supabase/functions/telegram-webhook/index.ts`**

```ts
import { resendMailer } from "../_shared/resend.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { handleTelegramUpdate } from "../_shared/webhook.ts";

// Telegram reintenta si no recibe 200: respondemos 200 salvo secreto inválido.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const store = supabaseStore(adminClient());
  const expected = await store.secret("telegram_webhook_secret");
  if (!expected || req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== expected) {
    return new Response("forbidden", { status: 403 });
  }
  const update = await req.json().catch(() => null);
  try {
    await handleTelegramUpdate({ store, mailer: (k) => resendMailer(k) }, update);
  } catch (err) {
    console.error("telegram-webhook", err);
  }
  return new Response("ok");
});
```

- [ ] **Step 6: Deploy** — `npx -y supabase@2.120.0 functions deploy telegram-webhook --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api`

Run: `curl -s -o /dev/null -w "%{http_code}" -X POST https://tgaromemhaixgdsdlxiq.supabase.co/functions/v1/telegram-webhook -d "{}"` → Expected: `403` (sin secreto todavía).

- [ ] **Step 7: Commit** — `feat(chat): webhook de telegram con respuesta por email si el visitante se fue`

---

### Task 7: `contact-submit` (formulario → emails + aviso)

**Files:**
- Create: `supabase/functions/_shared/contact.ts`, `supabase/functions/contact-submit/index.ts`, `tests/contact.test.ts`

**Interfaces:**
- Consumes: `validateContact`, `isHoneypotFilled`, `obj`, `renderTemplate`, `formatDate`, `TelegramApi`, `Mailer`, `Store`, fakes.
- Produces: `handleContact(deps: ContactDeps, input: { ip: string; body: unknown }, now?: number): Promise<HandlerResult>`; `ContactDeps = { store: Store; mailer: (apiKey: string) => Mailer; telegram: (token: string, groupId: string) => TelegramApi }`; `CONTACT_LIMIT = { perIp: 5, windowMs: 3_600_000 }`. Respuesta 200 `{ ok: true }`.

- [ ] **Step 1: Tests** — `tests/contact.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { CONTACT_LIMIT, handleContact } from "../supabase/functions/_shared/contact.ts";
import { FakeStore, fakeMailer, fakeTelegram } from "./fakes.ts";

const CFG = { telegram_group_id: "-100", sender: "Ninja <a@b.co>", notify_email: "lucas@x.com", site_url: "https://s", forms_thread_id: "" };
const body = { name: "Ana", email: "Ana@Mail.com", phone: "", business: "Kiosco", message: "Quiero una demo <ya>" };
let store: FakeStore;

beforeEach(() => {
  store = new FakeStore({ ...CFG }, { resend_api_key: "re_1", telegram_bot_token: "1:a" });
});

describe("handleContact", () => {
  test("válido: guarda, avisa a Lucas, responde al cliente y avisa en Telegram", async () => {
    const m = fakeMailer();
    const tg = fakeTelegram();
    const r = await handleContact({ store, mailer: m.factory, telegram: tg.factory }, { ip: "h", body });
    expect(r).toEqual({ status: 200, json: { ok: true } });
    expect(store.contacts[0]).toMatchObject({ name: "Ana", email: "ana@mail.com", ip_hash: "h" });
    expect(m.sent.map((x) => [x.to, x.replyTo])).toEqual([
      ["lucas@x.com", "ana@mail.com"],
      ["ana@mail.com", "lucas@x.com"],
    ]);
    expect(m.sent[0].html).toContain("&lt;ya&gt;");
    expect(tg.calls.topics).toEqual(["📥 Formularios"]);
    expect(store.cfg.forms_thread_id).toBe("101");
    expect(tg.calls.sent[0].text).toContain("Quiero una demo <ya>");
  });

  test("reutiliza el tema de Formularios", async () => {
    store.cfg.forms_thread_id = "77";
    const tg = fakeTelegram();
    await handleContact({ store, mailer: fakeMailer().factory, telegram: tg.factory }, { ip: "h", body });
    expect(tg.calls.topics).toHaveLength(0);
    expect(tg.calls.sent[0].threadId).toBe(77);
  });

  test("dominio sin verificar: falla el mail al cliente pero se guarda y Lucas recibe el suyo", async () => {
    const m = fakeMailer({ failTo: "ana@mail.com" });
    const r = await handleContact({ store, mailer: m.factory, telegram: fakeTelegram().factory }, { ip: "h", body });
    expect(r.status).toBe(200);
    expect(store.contacts).toHaveLength(1);
    expect(m.sent.map((x) => x.to)).toEqual(["lucas@x.com"]);
  });

  test("inválido → 400; honeypot → 200 sin guardar", async () => {
    const deps = { store, mailer: fakeMailer().factory, telegram: fakeTelegram().factory };
    expect((await handleContact(deps, { ip: "h", body: { ...body, email: "x" } })).status).toBe(400);
    expect((await handleContact(deps, { ip: "h", body: { ...body, website: "spam" } })).status).toBe(200);
    expect(store.contacts).toHaveLength(0);
  });

  test("límite por IP → 429", async () => {
    const deps = { store, mailer: fakeMailer().factory, telegram: fakeTelegram().factory };
    for (let i = 0; i < CONTACT_LIMIT.perIp; i++) await handleContact(deps, { ip: "h", body });
    expect((await handleContact(deps, { ip: "h", body })).status).toBe(429);
  });
});
```

- [ ] **Step 2: Ver fallar** — Run: `pnpm test tests/contact.test.ts` → FAIL.

- [ ] **Step 3: `supabase/functions/_shared/contact.ts`**

```ts
import type { Mailer } from "./resend.ts";
import type { TelegramApi } from "./telegram.ts";
import { formatDate, renderTemplate, type TemplateData } from "./template.ts";
import type { HandlerResult, Store, TemplateKey } from "./types.ts";
import { isHoneypotFilled, obj, validateContact } from "./validate.ts";

export const CONTACT_LIMIT = { perIp: 5, windowMs: 3_600_000 };
export const FORMS_TOPIC = "📥 Formularios";

export type ContactDeps = {
  store: Store;
  mailer: (apiKey: string) => Mailer;
  telegram: (token: string, groupId: string) => TelegramApi;
};

export async function handleContact(
  deps: ContactDeps,
  input: { ip: string; body: unknown },
  now = Date.now(),
): Promise<HandlerResult> {
  const { store } = deps;
  const o = obj(input.body);
  if (isHoneypotFilled(o)) return { status: 200, json: { ok: true } };
  const v = validateContact(o);
  if (!v.ok) return { status: 400, json: { error: v.error } };

  const bucket = `contact:ip:${input.ip}`;
  if ((await store.countRecent(bucket, CONTACT_LIMIT.windowMs)) >= CONTACT_LIMIT.perIp) {
    return { status: 429, json: { error: "Recibimos varias consultas seguidas. Probá más tarde." } };
  }
  await store.hit(bucket);
  await store.saveContact({ ...v.value, ip_hash: input.ip });

  const s = await store.settings();
  const c = v.value;
  const data: TemplateData = {
    nombre: c.name,
    email: c.email,
    telefono: c.phone,
    rubro: c.business,
    mensaje: c.message,
    fecha: formatDate(now),
    link_sitio: s.site_url,
  };

  // Emails: cada uno por separado, para que una falla no frene al otro.
  const key = await store.secret("resend_api_key");
  if (key && s.sender) {
    const mail = deps.mailer(key);
    const send = async (tplKey: TemplateKey, to: string, replyTo: string | undefined) => {
      const tpl = await store.template(tplKey);
      if (!tpl || !to) return;
      try {
        await mail({
          from: s.sender,
          to,
          subject: renderTemplate(tpl.subject, data, { html: false }),
          html: renderTemplate(tpl.html, data),
          replyTo,
        });
      } catch (err) {
        console.error(`contact-submit: ${tplKey}`, err);
      }
    };
    await send("contact_notify", s.notify_email, c.email);
    await send("contact_ack", c.email, s.notify_email || undefined);
  }

  // Aviso en Telegram, en el tema "Formularios".
  try {
    const token = await store.secret("telegram_bot_token");
    if (token && s.telegram_group_id) {
      const tg = deps.telegram(token, s.telegram_group_id);
      let thread = Number(s.forms_thread_id) || 0;
      if (!thread) {
        thread = await tg.createTopic(FORMS_TOPIC);
        await store.setSetting("forms_thread_id", String(thread));
      }
      const lines = ["📥 Nuevo contacto", `Nombre: ${c.name}`, `Email: ${c.email}`];
      if (c.phone) lines.push(`Teléfono: ${c.phone}`);
      if (c.business) lines.push(`Rubro: ${c.business}`);
      lines.push("", c.message);
      await tg.send(thread, lines.join("\n").slice(0, 4000));
    }
  } catch (err) {
    console.error("contact-submit: telegram", err);
  }

  return { status: 200, json: { ok: true } };
}
```

- [ ] **Step 4: Pasar tests** — Run: `pnpm test` → PASS. `pnpm typecheck` → OK.

- [ ] **Step 5: `supabase/functions/contact-submit/index.ts`**

```ts
import { handleContact } from "../_shared/contact.ts";
import { clientIp, cors, json, sha256 } from "../_shared/http.ts";
import { resendMailer } from "../_shared/resend.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { telegramApi } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const body = await req.json().catch(() => null);
    const r = await handleContact(
      { store: supabaseStore(adminClient()), mailer: (k) => resendMailer(k), telegram: (t, g) => telegramApi(t, g) },
      { ip: await sha256(clientIp(req)), body },
    );
    return json(r.status, r.json);
  } catch (err) {
    console.error("contact-submit", err);
    return json(500, { error: "No pudimos enviar tu consulta. Probá de nuevo." });
  }
});
```

- [ ] **Step 6: Deploy** — `npx -y supabase@2.120.0 functions deploy contact-submit --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api`

Run:
```bash
curl -s -X POST https://tgaromemhaixgdsdlxiq.supabase.co/functions/v1/contact-submit -H "apikey: sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn" -H "Content-Type: application/json" -d "{\"email\":\"x\"}"
```
Expected: `{"error":"Ingresá tu nombre."}`

- [ ] **Step 7: Commit** — `feat(contacto): edge function contact-submit con resend y aviso en telegram`

---

### Task 8: `admin-settings` + puesta en marcha (secretos, webhook, admin)

**Files:**
- Create: `supabase/functions/admin-settings/index.ts`, `scripts/set-secret.mjs`, `scripts/register-webhook.mjs`, `scripts/create-admin.mjs`

**Interfaces:**
- Consumes: `maskSecret`, `isEmail`, `obj`, `SECRET_NAMES`, `EDITABLE_SECRETS`, `telegramApi`, `resendMailer`, `supabaseStore`, `adminClient`, `http.ts`.
- Produces: POST `admin-settings` con `{ action }`:
  - `get` → `{ secrets: Record<SecretName, string | null> }` (enmascarados)
  - `set_secret` `{ name, value }` → `{ ok: true, masked }`
  - `register_webhook` → `{ ok: true }`
  - `test_telegram` → `{ ok: true }`
  - `test_resend` `{ to? }` → `{ ok: true }`
  - errores `{ error }` con 400/401/403/502/500.

- [ ] **Step 1: `supabase/functions/admin-settings/index.ts`**

```ts
import { bearer, cors, json } from "../_shared/http.ts";
import { resendMailer } from "../_shared/resend.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { telegramApi } from "../_shared/telegram.ts";
import { EDITABLE_SECRETS, SECRET_NAMES, type SecretName } from "../_shared/types.ts";
import { isEmail, maskSecret, obj } from "../_shared/validate.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const db = adminClient();
    const { data: u } = await db.auth.getUser(bearer(req));
    if (!u.user) return json(401, { error: "Iniciá sesión de nuevo." });
    const { data: adm } = await db.from("internal_admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
    if (!adm) return json(403, { error: "Sin acceso." });

    const body = obj(await req.json().catch(() => null));
    const store = supabaseStore(db);
    const s = await store.settings();
    const saveSecret = async (name: SecretName, value: string) => {
      const { error } = await db.from("app_secrets").upsert({ name, value, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    };

    switch (String(body.action ?? "")) {
      case "get": {
        const secrets: Record<string, string | null> = {};
        for (const n of SECRET_NAMES) secrets[n] = maskSecret(await store.secret(n));
        return json(200, { secrets });
      }
      case "set_secret": {
        const name = String(body.name ?? "") as SecretName;
        const value = String(body.value ?? "").trim();
        if (!EDITABLE_SECRETS.includes(name)) return json(400, { error: "Secreto no editable." });
        if (!value) return json(400, { error: "Ingresá un valor." });
        await saveSecret(name, value);
        return json(200, { ok: true, masked: maskSecret(value) });
      }
      case "register_webhook": {
        const token = await store.secret("telegram_bot_token");
        if (!token) return json(400, { error: "Cargá primero el token del bot." });
        const secret = crypto.randomUUID().replaceAll("-", "");
        await saveSecret("telegram_webhook_secret", secret);
        const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-webhook`,
            secret_token: secret,
            allowed_updates: ["message"],
            drop_pending_updates: true,
          }),
        });
        const d = obj(await r.json());
        if (d.ok !== true) return json(502, { error: `Telegram: ${String(d.description ?? r.status)}` });
        return json(200, { ok: true });
      }
      case "test_telegram": {
        const token = await store.secret("telegram_bot_token");
        if (!token || !s.telegram_group_id) return json(400, { error: "Falta el token o el ID del grupo." });
        await telegramApi(token, s.telegram_group_id).send(null, "✅ Prueba desde soft.ninja/internal: Telegram conectado.");
        return json(200, { ok: true });
      }
      case "test_resend": {
        const key = await store.secret("resend_api_key");
        const to = String(body.to ?? s.notify_email ?? "").trim();
        if (!key || !s.sender) return json(400, { error: "Falta la API key o el remitente." });
        if (!isEmail(to)) return json(400, { error: "Configurá un email de aviso válido." });
        await resendMailer(key)({ from: s.sender, to, subject: "Prueba de Resend · Ninja Soft", html: "<p>✅ Resend está conectado.</p>" });
        return json(200, { ok: true });
      }
      default:
        return json(400, { error: "Acción desconocida." });
    }
  } catch (err) {
    console.error("admin-settings", err);
    return json(500, { error: err instanceof Error ? err.message : "Error inesperado." });
  }
});
```

- [ ] **Step 2: Deploy** — `npx -y supabase@2.120.0 functions deploy admin-settings --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api`

Run: `curl -s -X POST https://tgaromemhaixgdsdlxiq.supabase.co/functions/v1/admin-settings -d "{}"` → Expected: `{"error":"Iniciá sesión de nuevo."}`

- [ ] **Step 3: `scripts/set-secret.mjs`**

```js
// Uso: node scripts/set-secret.mjs telegram_bot_token "%USERPROFILE%\.ninja-telegram-token"
// Lee el valor de un archivo (nunca de la línea de comandos) y lo guarda en app_secrets.
import { readFileSync } from "node:fs";
import { lit, sql } from "./sb.mjs";

const [name, file] = process.argv.slice(2);
if (!["telegram_bot_token", "resend_api_key"].includes(name) || !file) {
  throw new Error("Uso: node scripts/set-secret.mjs <telegram_bot_token|resend_api_key> <archivo>");
}
const value = readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
if (!value) throw new Error("El archivo está vacío");
await sql(
  `insert into app_secrets (name, value) values (${lit(name)}, ${lit(value)})
   on conflict (name) do update set value = excluded.value, updated_at = now()`,
);
console.log(`OK ${name} = ••••${value.slice(-4)}`);
```

- [ ] **Step 4: `scripts/register-webhook.mjs`**

```js
// Genera el secreto del webhook, lo guarda y registra la URL en Telegram (mismo efecto que el botón de /internal).
import { randomUUID } from "node:crypto";
import { lit, SB_URL, sql } from "./sb.mjs";

const [{ value: token } = {}] = await sql("select value from app_secrets where name = 'telegram_bot_token'");
if (!token) throw new Error("Primero: node scripts/set-secret.mjs telegram_bot_token <archivo>");
const secret = randomUUID().replaceAll("-", "");
await sql(
  `insert into app_secrets (name, value) values ('telegram_webhook_secret', ${lit(secret)})
   on conflict (name) do update set value = excluded.value, updated_at = now()`,
);
const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${SB_URL}/functions/v1/telegram-webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
});
const d = await r.json();
if (!d.ok) throw new Error(`Telegram: ${d.description}`);
const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
console.log("Webhook:", info.result.url, "· pendientes:", info.result.pending_update_count);
```

- [ ] **Step 5: `scripts/create-admin.mjs`**

```js
// Uso (PowerShell): $env:ADMIN_PASSWORD='...'; node scripts/create-admin.mjs lucas@mail.com
// Crea (o actualiza la contraseña de) un usuario y lo agrega a internal_admins.
import { createClient } from "@supabase/supabase-js";
import { lit, SB_URL, serviceKey, sql } from "./sb.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
if (!email.includes("@")) throw new Error("Pasá el email del admin");
if (password.length < 12) throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres");

const admin = createClient(SB_URL, await serviceKey(), { auth: { persistSession: false } }).auth.admin;
const [existing] = await sql(`select id from auth.users where lower(email) = ${lit(email)}`);
let id = existing?.id;
if (id) {
  const { error } = await admin.updateUserById(id, { password });
  if (error) throw error;
} else {
  const { data, error } = await admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  id = data.user.id;
}
await sql(`insert into internal_admins (user_id) values (${lit(id)}) on conflict do nothing`);
console.log(`OK admin ${email}`);
```

- [ ] **Step 6: Puesta en marcha** (los archivos los dejó Lucas en su perfil)

```bash
node scripts/set-secret.mjs telegram_bot_token "$USERPROFILE/.ninja-telegram-token"
node scripts/register-webhook.mjs
```
Expected: `OK telegram_bot_token = ••••xxxx` y `Webhook: https://tgaromemhaixgdsdlxiq.supabase.co/functions/v1/telegram-webhook · pendientes: 0`.

Si existe `%USERPROFILE%\.ninja-resend-key`: `node scripts/set-secret.mjs resend_api_key "$USERPROFILE/.ninja-resend-key"`.
Guardar el email de aviso que indique Lucas: `node -e "import('./scripts/sb.mjs').then(m=>m.sql(\"update app_settings set value='<EMAIL_DE_LUCAS>' where key='notify_email'\"))"` — **pedirle el email a Lucas antes de este paso.**

El admin lo crea Lucas en su PowerShell (la contraseña no pasa por el chat): `$env:ADMIN_PASSWORD='...'; node scripts/create-admin.mjs <su-email>`.

- [ ] **Step 7: Commit** — `feat(internal): edge function admin-settings y scripts de puesta en marcha`

---

### Task 9: Cliente Supabase y ChatWidget en la web

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/functionError.ts`, `lib/chat-events.ts`, `components/chat/ChatWidget.tsx`, `components/chat/OpenChatButton.tsx`
- Modify: `app/page.tsx`, `app/globals.css`, `components/Nav.tsx`, `components/Closing.tsx`, `lib/content.ts`

**Interfaces:**
- Produces: `visitorClient(): SupabaseClient` (storageKey `ns-chat`), `internalClient(): SupabaseClient` (storageKey `ns-internal`), `SUPABASE_URL`, `SUPABASE_KEY`; `functionError(err, fallback): Promise<string>`; `OPEN_CHAT`, `openChat()`; `<ChatWidget />`; `<OpenChatButton className label?>{children}</OpenChatButton>`.

- [ ] **Step 1: `lib/supabase/client.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Valores públicos (URL + publishable key): pueden ir en el bundle.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tgaromemhaixgdsdlxiq.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn";

let visitor: SupabaseClient | null = null;
let internal: SupabaseClient | null = null;

// Sesiones separadas: el visitante anónimo del chat y el admin de /internal no se pisan.
export function visitorClient(): SupabaseClient {
  return (visitor ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: "ns-chat" } }));
}

export function internalClient(): SupabaseClient {
  return (internal ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: "ns-internal" } }));
}
```

- [ ] **Step 2: `lib/supabase/functionError.ts`**

```ts
// Extrae el { error } que devuelven nuestras Edge Functions.
export async function functionError(err: unknown, fallback: string): Promise<string> {
  const ctx = (err as { context?: unknown } | null)?.context;
  if (ctx instanceof Response) {
    const j = (await ctx.json().catch(() => null)) as { error?: string } | null;
    if (j?.error) return j.error;
  }
  return fallback;
}
```

- [ ] **Step 3: `lib/chat-events.ts`**

```ts
export const OPEN_CHAT = "ns:open-chat";

export function openChat() {
  window.dispatchEvent(new Event(OPEN_CHAT));
}
```

- [ ] **Step 4: `components/chat/OpenChatButton.tsx`**

```tsx
"use client";

import { openChat } from "@/lib/chat-events";

export function OpenChatButton({ className, label, children }: { className?: string; label?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={openChat} aria-label={label} className={className}>
      {children}
    </button>
  );
}
```

- [ ] **Step 5: `components/chat/ChatWidget.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react";
import { OPEN_CHAT } from "@/lib/chat-events";
import { visitorClient } from "@/lib/supabase/client";
import { functionError } from "@/lib/supabase/functionError";

// Chat web: los mensajes van a un tema de Telegram y las respuestas llegan por Realtime.
type Msg = { id: string; sender: "visitor" | "agent" | "system"; body: string; created_at: string };
type Sess = { id: string; name: string; contact: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Sess | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addMessages = useCallback((rows: Msg[]) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev, ...rows.filter((r) => !seen.has(r.id))];
      return merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const attach = useCallback(
    async (s: Sess) => {
      const sb = visitorClient();
      setSession(s);
      const { data } = await sb.from("chat_messages").select("id,sender,body,created_at").eq("session_id", s.id).order("created_at");
      if (data) addMessages(data as Msg[]);
      channelRef.current?.unsubscribe();
      channelRef.current = sb
        .channel(`chat:${s.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${s.id}` },
          (p) => addMessages([p.new as Msg]),
        )
        .subscribe();
    },
    [addMessages],
  );

  // Retoma la conversación si este navegador ya chateó.
  useEffect(() => {
    const sb = visitorClient();
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!data.session || !alive) return;
      const { data: s } = await sb.from("chat_sessions").select("id,name,contact").is("closed_at", null).maybeSingle();
      if (s && alive) await attach(s as Sess);
    })();
    sb.rpc("get_public_config").then(({ data }) => {
      const w = Number((data as { wait_minutes?: number } | null)?.wait_minutes);
      if (w > 0) setWaitMinutes(w);
    });
    return () => {
      alive = false;
      channelRef.current?.unsubscribe();
    };
  }, [attach]);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(OPEN_CHAT, h);
    return () => window.removeEventListener(OPEN_CHAT, h);
  }, []);

  // Latido: mientras el chat está abierto y visible, el visitante "está".
  useEffect(() => {
    if (!open || !session) return;
    const sb = visitorClient();
    const touch = () => {
      if (document.visibilityState === "visible") void sb.rpc("chat_touch");
    };
    touch();
    const id = window.setInterval(touch, 45_000);
    document.addEventListener("visibilitychange", touch);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", touch);
    };
  }, [open, session]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (sending || !message) return;
    setError(null);
    setSending(true);
    try {
      const sb = visitorClient();
      const { data: cur } = await sb.auth.getSession();
      if (!cur.session) {
        const { error: aerr } = await sb.auth.signInAnonymously();
        if (aerr) throw new Error("No pudimos iniciar el chat. Probá de nuevo.");
      }
      const { data, error: ferr } = await sb.functions.invoke("chat-send", { body: { name, contact, message, website } });
      if (ferr) throw new Error(await functionError(ferr, "No se pudo enviar. Probá de nuevo."));
      const r = data as { id: string; sessionId: string };
      if (!session) await attach({ id: r.sessionId, name: name.trim(), contact: contact.trim() });
      addMessages([{ id: r.id, sender: "visitor", body: message, created_at: new Date().toISOString() }]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  }

  const last = messages[messages.length - 1];
  const waiting = !!last && last.sender === "visitor" && now - Date.parse(last.created_at) > waitMinutes * 60_000;
  const byEmail = !!session && session.contact.includes("@");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        aria-expanded={open}
        className={`chat-fab ${open ? "max-sm:hidden" : ""}`}
      >
        {open ? <X size={24} weight="bold" /> : <ChatCircleDots size={28} weight="fill" />}
      </button>

      {open && (
        <section role="dialog" aria-label="Chat con Ninja Soft" className="chat-panel">
          <header className="flex items-center gap-3 border-b border-black/[.06] px-4 py-3">
            <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-8 w-auto" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-tight">Ninja Soft</p>
              <p className="text-[12px] text-[#86868b]">Te respondemos en minutos</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="grid h-9 w-9 place-items-center rounded-full bg-black/[.05]"
            >
              <X size={16} weight="bold" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            <Bubble sender="agent" body="¡Hola! Contanos en qué te podemos ayudar. Te respondemos acá mismo." />
            {messages.map((m) => (
              <Bubble key={m.id} sender={m.sender} body={m.body} />
            ))}
            {waiting && (
              <p className="mx-auto max-w-[90%] rounded-2xl bg-black/[.04] px-3 py-2 text-center text-[12.5px] text-[#6e6e73]">
                Te respondemos a la brevedad.{" "}
                {byEmail ? "Si cerrás la página, la respuesta te llega por email." : "Si cerrás la página, te contactamos."}
              </p>
            )}
          </div>

          <form onSubmit={send} className="border-t border-black/[.06] p-3">
            {!session && (
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  aria-label="Tu nombre"
                  className="chat-input"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  maxLength={120}
                  autoComplete="email"
                  placeholder="Email o teléfono"
                  aria-label="Email o teléfono"
                  className="chat-input"
                />
              </div>
            )}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
            />
            {error && (
              <p role="alert" className="mb-2 text-[12.5px] text-[#d70015]">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                maxLength={2000}
                placeholder="Escribí tu mensaje"
                aria-label="Mensaje"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                className="chat-input max-h-32 min-h-[44px] flex-1 resize-none"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label="Enviar"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white transition disabled:opacity-40"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ sender, body }: { sender: Msg["sender"]; body: string }) {
  if (sender === "system") return <p className="text-center text-[12.5px] text-[#86868b]">{body}</p>;
  const mine = sender === "visitor";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[15px] leading-snug ${
          mine ? "bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white" : "bg-[#f2f2f7] text-[#1d1d1f]"
        }`}
      >
        {body}
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Estilos** — agregar al final de `app/globals.css`:

```css
/* chat web */
.chat-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 50;
  display: grid; place-items: center; width: 56px; height: 56px; border-radius: 9999px;
  color: #fff; background: linear-gradient(135deg, #ff4b22, #ff8a1f);
  box-shadow: 0 12px 30px rgba(255, 75, 34, 0.4);
  transition: transform 0.2s ease;
}
.chat-fab:hover { transform: translateY(-2px); }
.chat-panel {
  position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column;
  background: #fff; color: #1d1d1f;
}
@media (min-width: 640px) {
  .chat-panel {
    inset: auto 20px 88px auto; width: 380px; height: min(600px, calc(100vh - 120px));
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 24px 60px rgba(11, 7, 32, 0.25);
  }
}
.chat-input {
  width: 100%; border-radius: 14px; background: #f2f2f7; padding: 10px 12px;
  font-size: 16px; /* 16px evita el zoom de iOS */ color: #1d1d1f; outline: none;
}
.chat-input:focus { box-shadow: 0 0 0 2px rgba(255, 75, 34, 0.45); }
```

- [ ] **Step 7: Montar el widget** — en `app/page.tsx` importar `import { ChatWidget } from "@/components/chat/ChatWidget";` y agregar `<ChatWidget />` justo después de `<Footer />`.

- [ ] **Step 8: Reemplazar WhatsApp en `components/Nav.tsx`**
  - Import: `import { NAV_LINKS, POS_APP_URL, PRODUCTS, SERVICES } from "@/lib/content";` y `import { openChat } from "@/lib/chat-events";`.
  - Botón "Hablemos" de escritorio: reemplazar el `<a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="flex min-h-[40px] ...">` por `<button type="button" onClick={openChat} className="flex min-h-[40px] items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-semibold text-paper transition hover:bg-ink/85">` (mismo contenido, cerrar con `</button>`).
  - Hoja mobile: reemplazar
    ```tsx
    <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn-flame justify-center">
      Hablar por WhatsApp
    </a>
    ```
    por
    ```tsx
    <button
      type="button"
      onClick={() => {
        close();
        openChat();
      }}
      className="btn-flame justify-center"
    >
      Abrir el chat
    </button>
    ```

- [ ] **Step 9: Reemplazar WhatsApp en `components/Closing.tsx`**
  - Imports: quitar `whatsappUrl` del import de `@/lib/content`; agregar `ChatCircleDots` al import de `@phosphor-icons/react/dist/ssr` (y quitar `WhatsappLogo`); agregar `import { OpenChatButton } from "@/components/chat/OpenChatButton";`.
  - Contacto: `Te respondemos por WhatsApp, en horario comercial.` → `Escribinos por el chat o dejanos tu consulta. Te respondemos en horario comercial.`
  - Botón: `<a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn-flame">Escribir por WhatsApp</a>` → `<OpenChatButton className="btn-flame">Abrir el chat</OpenChatButton>`.
  - Footer: el `<a href={whatsappUrl()} ... aria-label="WhatsApp de Ninja Soft" className="foot-social"><WhatsappLogo size={22} /></a>` → `<OpenChatButton label="Chatear con Ninja Soft" className="foot-social"><ChatCircleDots size={22} /></OpenChatButton>`.

- [ ] **Step 10: `lib/content.ts`** — borrar `WHATSAPP_NUMBER` y `whatsappUrl` (líneas 5–7). Run: `grep -rn "whatsappUrl\|WHATSAPP_NUMBER" components lib app` → sin resultados.

- [ ] **Step 11: Verificar** — Run: `pnpm lint && pnpm typecheck && pnpm test`. Con el dev server (`pnpm dev --port 3100`) abrir http://localhost:3100, abrir el chat, escribir nombre `Prueba`, contacto `prueba@test.com`, mensaje `hola`:
  - aparece un tema "Prueba · prueba@test.com" en el grupo de Telegram con "hola";
  - responder "hola desde Telegram" dentro del tema → aparece en el chat en < 3 s;
  - recargar la página → la conversación sigue;
  - en 390 px de ancho el panel ocupa la pantalla y el botón flotante no tapa "Enviar".
  Después borrar el tema de prueba en Telegram y la sesión: `node -e "import('./scripts/sb.mjs').then(m=>m.sql(\"delete from auth.users where id in (select user_id from chat_sessions where name='Prueba')\"))"`.

- [ ] **Step 12: Commit** — `feat(chat): widget de chat web en vivo y fin de los botones de whatsapp`

---

### Task 10: Formulario de contacto

**Files:**
- Create: `components/ContactForm.tsx`
- Modify: `components/Closing.tsx` (sección `Contact`), `app/globals.css`

**Interfaces:**
- Consumes: `visitorClient`, `functionError`.
- Produces: `<ContactForm />` (envía `name, email, phone, business, message, website`).

- [ ] **Step 1: `components/ContactForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { visitorClient } from "@/lib/supabase/client";
import { functionError } from "@/lib/supabase/functionError";

const RUBROS = ["Gastronomía", "Retail / textil", "Kiosco / almacén", "Profesionales / servicios", "Industria alimenticia", "Otro"];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const { error: ferr } = await visitorClient().functions.invoke("contact-submit", { body });
    if (ferr) {
      setError(await functionError(ferr, "No pudimos enviar tu consulta. Probá de nuevo."));
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="mx-auto mt-10 max-w-[560px] rounded-[24px] bg-white/[.06] p-8 text-center ring-1 ring-inset ring-white/10">
        <CheckCircle size={40} weight="fill" className="mx-auto text-[#30d158]" />
        <p className="mt-3 text-[20px] font-bold">¡Recibimos tu consulta!</p>
        <p className="mt-1 text-mist">Te contactamos a la brevedad. Revisá tu email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 grid max-w-[560px] gap-3 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Nombre" aria-label="Nombre" className="contact-input" />
        <input name="email" type="email" required maxLength={120} autoComplete="email" placeholder="Email" aria-label="Email" className="contact-input" />
        <input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="Teléfono (opcional)" aria-label="Teléfono" className="contact-input" />
        <select name="business" defaultValue="" aria-label="Rubro" className="contact-input">
          <option value="" disabled>
            Rubro
          </option>
          {RUBROS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <textarea name="message" required minLength={5} maxLength={4000} rows={4} placeholder="Contanos qué necesitás" aria-label="Mensaje" className="contact-input resize-y" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="text-[14px] text-[#ff6961]">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn-flame justify-center disabled:opacity-60">
        {state === "sending" ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Estilos** — al final de `app/globals.css`:

```css
/* formulario de contacto (sobre fondo oscuro) */
.contact-input {
  width: 100%; border-radius: 14px; padding: 12px 14px; font-size: 16px;
  color: #fff; background: rgba(255, 255, 255, 0.07);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1); outline: none;
}
.contact-input::placeholder { color: rgba(184, 174, 220, 0.8); }
.contact-input:focus { box-shadow: inset 0 0 0 1px rgba(255, 138, 31, 0.8); }
.contact-input option { color: #1d1d1f; }
```

- [ ] **Step 3: Montarlo** — en `components/Closing.tsx`, sección `Contact`: importar `import { ContactForm } from "@/components/ContactForm";` y agregar `<ContactForm />` después del `<div className="mt-8 flex ...">` de los botones, antes de `</section>`.

- [ ] **Step 4: Verificar** — `pnpm lint && pnpm typecheck`. En http://localhost:3100#hablemos enviar el formulario con tu email:
  - aparece el tema "📥 Formularios" en Telegram con los datos;
  - si `notify_email` y la API key de Resend están cargados, llega el aviso;
  - con dominio sin verificar, el mail al cliente falla en silencio (ver logs de `contact-submit`) y la UI igual muestra "¡Recibimos tu consulta!";
  - 390 px: campos en una columna, sin scroll horizontal.
  Limpiar: `node -e "import('./scripts/sb.mjs').then(m=>m.sql(\"delete from contact_requests where email='<tu-email>'\"))"`.

- [ ] **Step 5: Commit** — `feat(contacto): formulario de contacto en Hablemos`

---

### Task 11: Panel `/internal` — login, inicio, chats y contactos

**Files:**
- Create: `app/internal/layout.tsx`, `app/internal/page.tsx`, `components/internal/InternalApp.tsx`, `components/internal/LoginForm.tsx`, `components/internal/HomeTab.tsx`, `components/internal/ChatsTab.tsx`, `components/internal/ContactsTab.tsx`

**Interfaces:**
- Consumes: `internalClient()`.
- Produces: `<InternalApp />`; pestañas con props `{ sb: SupabaseClient }`. `InternalApp` define `TabKey = "home" | "chats" | "contacts" | "settings" | "templates"`; Task 12 agrega los componentes `SettingsTab` y `TemplatesTab` con la misma firma.

- [ ] **Step 1: `app/internal/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internal · Ninja Soft",
  robots: { index: false, follow: false },
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: `app/internal/page.tsx`**

```tsx
import { InternalApp } from "@/components/internal/InternalApp";

export default function InternalPage() {
  return <InternalApp />;
}
```

- [ ] **Step 3: `components/internal/LoginForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { internalClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await internalClient().auth.signInWithPassword({ email, password });
    if (err) setError("Email o contraseña incorrectos.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="grid w-full max-w-[360px] gap-3">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">Panel interno</h1>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className="int-input" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoComplete="current-password" className="int-input" />
      {error && <p role="alert" className="text-[14px] text-[#d70015]">{error}</p>}
      <button type="submit" disabled={busy} className="btn-flame justify-center disabled:opacity-60">
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: `components/internal/InternalApp.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { internalClient } from "@/lib/supabase/client";
import { ChatsTab } from "./ChatsTab";
import { ContactsTab } from "./ContactsTab";
import { HomeTab } from "./HomeTab";
import { LoginForm } from "./LoginForm";
import { SettingsTab } from "./SettingsTab";
import { TemplatesTab } from "./TemplatesTab";

const TABS = [
  { key: "home", label: "Inicio" },
  { key: "chats", label: "Chats" },
  { key: "contacts", label: "Contactos" },
  { key: "settings", label: "Configuración" },
  { key: "templates", label: "Plantillas" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] px-4">{children}</main>;
}

export function InternalApp() {
  const sb = internalClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("home");

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!session) {
      setAdmin(null);
      return;
    }
    sb.from("internal_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setAdmin(!!data));
  }, [sb, session]);

  if (!ready) return <Shell><p className="text-[#86868b]">Cargando…</p></Shell>;
  if (!session) return <Shell><LoginForm /></Shell>;
  if (admin === null) return <Shell><p className="text-[#86868b]">Verificando acceso…</p></Shell>;
  if (!admin) {
    return (
      <Shell>
        <div className="text-center">
          <p>Tu usuario no tiene acceso al panel interno.</p>
          <button type="button" onClick={() => sb.auth.signOut()} className="link-more mt-4">
            Salir
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="sticky top-0 z-10 border-b border-black/[.06] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3">
          <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-7 w-auto" />
          <b className="text-[15px]">Internal</b>
          <nav className="seg order-last w-full overflow-x-auto sm:order-none sm:w-auto" aria-label="Secciones">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-medium ${
                  tab === t.key ? "bg-white shadow-sm" : "text-[#6e6e73]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <span className="ml-auto hidden text-[13px] text-[#86868b] sm:inline">{session.user.email}</span>
          <button type="button" onClick={() => sb.auth.signOut()} className="text-[14px] font-semibold text-flame-link">
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-8">
        {tab === "home" && <HomeTab sb={sb} />}
        {tab === "chats" && <ChatsTab sb={sb} />}
        {tab === "contacts" && <ContactsTab sb={sb} />}
        {tab === "settings" && <SettingsTab sb={sb} />}
        {tab === "templates" && <TemplatesTab sb={sb} />}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: `components/internal/HomeTab.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowUpRight } from "@phosphor-icons/react";

export function HomeTab({ sb }: { sb: SupabaseClient }) {
  const [links, setLinks] = useState<{ pos: string; food: string }>({ pos: "", food: "" });
  const [counts, setCounts] = useState({ chats: 0, contacts: 0 });

  useEffect(() => {
    sb.from("app_settings")
      .select("key,value")
      .in("key", ["pos_internal_url", "food_internal_url"])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
        setLinks({ pos: m.pos_internal_url ?? "", food: m.food_internal_url ?? "" });
      });
    Promise.all([
      sb.from("chat_sessions").select("id", { count: "exact", head: true }).is("closed_at", null),
      sb.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "nuevo"),
    ]).then(([c, k]) => setCounts({ chats: c.count ?? 0, contacts: k.count ?? 0 }));
  }, [sb]);

  const cards = [
    { href: links.pos, logo: "/images/brand/ninjapos-logo-light.webp", w: 640, h: 154, label: "Internal NinjaPOS" },
    { href: links.food, logo: "/images/brand/ninjafood-logo-light.webp", w: 640, h: 142, label: "Internal Ninja Food" },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a key={c.label} href={c.href || undefined} target="_blank" rel="noopener noreferrer" className="int-card group flex items-center justify-between gap-4 p-6">
            <span>
              <img src={c.logo} alt="" width={c.w} height={c.h} className="h-8 w-auto" />
              <span className="mt-3 block text-[14px] text-[#6e6e73]">{c.label}</span>
            </span>
            <ArrowUpRight size={22} className="text-[#86868b] transition group-hover:text-[#ff4b22]" />
          </a>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="int-card p-6">
          <p className="text-[13px] text-[#86868b]">Chats abiertos</p>
          <p className="mt-1 text-[34px] font-bold">{counts.chats}</p>
        </div>
        <div className="int-card p-6">
          <p className="text-[13px] text-[#86868b]">Contactos nuevos</p>
          <p className="mt-1 text-[34px] font-bold">{counts.contacts}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `components/internal/ChatsTab.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = { id: string; name: string; contact: string; created_at: string; last_seen_at: string };
type Msg = { id: string; sender: string; body: string; created_at: string };
const fmt = (s: string) => new Date(s).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

export function ChatsTab({ sb }: { sb: SupabaseClient }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);

  useEffect(() => {
    sb.from("chat_sessions")
      .select("id,name,contact,created_at,last_seen_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [sb]);

  useEffect(() => {
    if (!sel) return;
    sb.from("chat_messages")
      .select("id,sender,body,created_at")
      .eq("session_id", sel)
      .order("created_at")
      .then(({ data }) => setMsgs((data ?? []) as Msg[]));
  }, [sb, sel]);

  if (!rows.length) return <p className="text-[#86868b]">Todavía no hay chats.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <ul className="int-card divide-y divide-black/[.06] overflow-hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => setSel(r.id)} className={`w-full px-4 py-3 text-left ${sel === r.id ? "bg-[#fff1ea]" : ""}`}>
              <b className="block text-[15px]">{r.name}</b>
              <span className="block text-[13px] text-[#6e6e73]">{r.contact}</span>
              <span className="block text-[12px] text-[#86868b]">{fmt(r.created_at)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="int-card min-h-[300px] space-y-2 p-4">
        {!sel && <p className="text-[#86868b]">Elegí un chat. Las respuestas se escriben desde Telegram.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-start" : "justify-end"}`}>
            <p className={`max-w-[80%] whitespace-pre-wrap rounded-[16px] px-3 py-2 text-[14px] ${m.sender === "visitor" ? "bg-[#f2f2f7]" : "bg-[#ff4b22] text-white"}`}>
              {m.body}
              <span className="mt-1 block text-[11px] opacity-60">{fmt(m.created_at)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: `components/internal/ContactsTab.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = { id: string; name: string; email: string; phone: string | null; business: string | null; message: string; status: string; created_at: string };

export function ContactsTab({ sb }: { sb: SupabaseClient }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    sb.from("contact_requests")
      .select("id,name,email,phone,business,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [sb]);

  async function markDone(id: string) {
    const { error } = await sb.from("contact_requests").update({ status: "respondido" }).eq("id", id);
    if (!error) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "respondido" } : r)));
  }

  if (!rows.length) return <p className="text-[#86868b]">Todavía no hay contactos.</p>;

  return (
    <ul className="grid gap-3">
      {rows.map((r) => (
        <li key={r.id} className="int-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="text-[16px]">{r.name}</b>
            <span className="text-[12px] text-[#86868b]">{new Date(r.created_at).toLocaleString("es-AR")}</span>
          </div>
          <p className="text-[14px] text-[#6e6e73]">
            <a href={`mailto:${r.email}`} className="underline">{r.email}</a>
            {r.phone && ` · ${r.phone}`}
            {r.business && ` · ${r.business}`}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[15px]">{r.message}</p>
          <div className="mt-3">
            {r.status === "nuevo" ? (
              <button type="button" onClick={() => markDone(r.id)} className="text-[14px] font-semibold text-flame-link">
                Marcar respondido
              </button>
            ) : (
              <span className="text-[13px] text-[#30a14e]">Respondido</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 8: Stubs temporales** para que compile hasta Task 12 — crear `components/internal/SettingsTab.tsx` y `components/internal/TemplatesTab.tsx` con:

```tsx
"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export function SettingsTab(_props: { sb: SupabaseClient }) {
  return null;
}
```

(en `TemplatesTab.tsx`, mismo contenido con `export function TemplatesTab`). Task 12 los reemplaza completos.

- [ ] **Step 9: Estilos** — al final de `app/globals.css`:

```css
/* panel interno */
.int-card { border-radius: 20px; background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 26px rgba(0, 0, 0, 0.05); }
.int-input {
  width: 100%; border-radius: 12px; background: #fff; padding: 11px 13px; font-size: 16px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1); outline: none;
}
.int-input:focus { box-shadow: inset 0 0 0 2px rgba(255, 75, 34, 0.6); }
```

- [ ] **Step 10: Verificar** — `pnpm lint && pnpm typecheck`. En http://localhost:3100/internal: login con el admin creado en Task 8 → ves Inicio con las dos tarjetas (abren en pestaña nueva) y los contadores; Chats y Contactos listan lo de las pruebas. Con un usuario que no está en `internal_admins` → "Tu usuario no tiene acceso". El chat flotante NO aparece en /internal.

- [ ] **Step 11: Commit** — `feat(internal): panel con login, accesos a pos y food, chats y contactos`

---

### Task 12: `/internal` — Configuración y Plantillas

**Files:**
- Modify (reemplazo completo de los stubs): `components/internal/SettingsTab.tsx`, `components/internal/TemplatesTab.tsx`

**Interfaces:**
- Consumes: `admin-settings` (Task 8), tablas `app_settings` / `email_templates`, `renderTemplate`, `TEMPLATE_VARS`, `formatDate` desde `@/supabase/functions/_shared/template`, `functionError`.

- [ ] **Step 1: `components/internal/SettingsTab.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { functionError } from "@/lib/supabase/functionError";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "notify_email", label: "Email de aviso", hint: "Dónde te llegan los contactos." },
  { key: "sender", label: "Remitente", hint: 'Ej.: Ninja Soft <hola@soft.ninja> (dominio verificado en Resend).' },
  { key: "telegram_group_id", label: "ID del grupo de Telegram" },
  { key: "wait_minutes", label: "Minutos hasta el aviso de espera" },
  { key: "away_minutes", label: "Minutos sin actividad para responder por email" },
  { key: "site_url", label: "URL del sitio" },
  { key: "pos_internal_url", label: "URL internal NinjaPOS" },
  { key: "food_internal_url", label: "URL internal Ninja Food" },
];

export function SettingsTab({ sb }: { sb: SupabaseClient }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [secrets, setSecrets] = useState<Record<string, string | null>>({});
  const [draft, setDraft] = useState({ telegram_bot_token: "", resend_api_key: "" });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await sb.functions.invoke("admin-settings", { body: { action, ...extra } });
    if (error) throw new Error(await functionError(error, "Error inesperado."));
    return data as Record<string, unknown>;
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    setNote(null);
    try {
      await fn();
      setNote({ ok: true, text: label });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Error inesperado." });
    }
  }

  useEffect(() => {
    sb.from("app_settings")
      .select("key,value")
      .then(({ data }) => setValues(Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))));
    call("get").then((d) => setSecrets(d.secrets as Record<string, string | null>)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb]);

  const saveSettings = () =>
    run("Ajustes guardados.", async () => {
      const rows = FIELDS.map((f) => ({ key: f.key, value: (values[f.key] ?? "").trim(), updated_at: new Date().toISOString() }));
      const { error } = await sb.from("app_settings").upsert(rows);
      if (error) throw new Error(error.message);
    });

  const saveSecret = (name: "telegram_bot_token" | "resend_api_key") =>
    run("Clave guardada.", async () => {
      const d = await call("set_secret", { name, value: draft[name] });
      setSecrets((s) => ({ ...s, [name]: d.masked as string }));
      setDraft((x) => ({ ...x, [name]: "" }));
    });

  return (
    <div className="grid gap-6">
      {note && (
        <p role="status" className={`rounded-[14px] px-4 py-3 text-[14px] ${note.ok ? "bg-[#e8f8ee] text-[#1e7a3e]" : "bg-[#fdecec] text-[#b3261e]"}`}>
          {note.text}
        </p>
      )}

      <section className="int-card grid gap-4 p-6">
        <h2 className="text-[20px] font-bold">Claves</h2>
        {(
          [
            ["telegram_bot_token", "Token del bot de Telegram"],
            ["resend_api_key", "API key de Resend"],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1 text-[14px]">
              <span>
                {label} <span className="text-[#86868b]">· actual: {secrets[name] ?? "sin cargar"}</span>
              </span>
              <input
                type="password"
                autoComplete="off"
                value={draft[name]}
                onChange={(e) => setDraft((x) => ({ ...x, [name]: e.target.value }))}
                placeholder="Pegá el nuevo valor"
                className="int-input"
              />
            </label>
            <button type="button" disabled={!draft[name].trim()} onClick={() => saveSecret(name)} className="btn-flame justify-center disabled:opacity-50">
              Guardar
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => run("Webhook de Telegram registrado.", () => call("register_webhook"))} className="int-btn">
            Registrar webhook
          </button>
          <button type="button" onClick={() => run("Mensaje de prueba enviado a Telegram.", () => call("test_telegram"))} className="int-btn">
            Probar Telegram
          </button>
          <button type="button" onClick={() => run("Email de prueba enviado.", () => call("test_resend"))} className="int-btn">
            Probar email
          </button>
        </div>
      </section>

      <section className="int-card grid gap-4 p-6">
        <h2 className="text-[20px] font-bold">Ajustes</h2>
        {FIELDS.map((f) => (
          <label key={f.key} className="grid gap-1 text-[14px]">
            <span>{f.label}</span>
            <input value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="int-input" />
            {f.hint && <span className="text-[12px] text-[#86868b]">{f.hint}</span>}
          </label>
        ))}
        <button type="button" onClick={saveSettings} className="btn-flame justify-self-start">
          Guardar ajustes
        </button>
      </section>
    </div>
  );
}
```

Agregar a `app/globals.css`:

```css
.int-btn { border-radius: 9999px; padding: 9px 16px; font-size: 14px; font-weight: 600; background: #fff; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12); }
.int-btn:hover { box-shadow: inset 0 0 0 1px rgba(255, 75, 34, 0.6); }
```

- [ ] **Step 2: `components/internal/TemplatesTab.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDate, renderTemplate, TEMPLATE_VARS, type TemplateData } from "@/supabase/functions/_shared/template";

type Tpl = { key: string; subject: string; html: string };
const NAMES: Record<string, string> = {
  contact_ack: "Auto-respuesta al cliente",
  contact_notify: "Aviso de nuevo contacto (a vos)",
  chat_reply: "Respuesta del chat por email",
};
const SAMPLE: TemplateData = {
  nombre: "Juan Pérez",
  email: "juan@ejemplo.com",
  telefono: "+54 9 341 555 1234",
  rubro: "Kiosco / almacén",
  mensaje: "Hola, quiero saber cómo funciona NinjaPOS para mi kiosco.",
  respuesta: "¡Hola Juan! Te cuento: NinjaPOS funciona en cualquier celular o tablet…",
  link_sitio: typeof window === "undefined" ? "" : window.location.origin,
};

export function TemplatesTab({ sb }: { sb: SupabaseClient }) {
  const [tpls, setTpls] = useState<Tpl[]>([]);
  const [sel, setSel] = useState("contact_ack");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    sb.from("email_templates")
      .select("key,subject,html")
      .order("key")
      .then(({ data }) => setTpls((data ?? []) as Tpl[]));
  }, [sb]);

  const cur = tpls.find((t) => t.key === sel);
  const preview = useMemo(() => (cur ? renderTemplate(cur.html, { ...SAMPLE, fecha: formatDate(Date.now()) }) : ""), [cur]);
  const edit = (patch: Partial<Tpl>) => setTpls((ts) => ts.map((t) => (t.key === sel ? { ...t, ...patch } : t)));

  async function save() {
    if (!cur) return;
    const { error } = await sb
      .from("email_templates")
      .update({ subject: cur.subject, html: cur.html, updated_at: new Date().toISOString() })
      .eq("key", cur.key);
    setNote(error ? `Error: ${error.message}` : "Plantilla guardada.");
  }

  return (
    <div className="grid gap-4">
      <div className="seg w-max max-w-full overflow-x-auto">
        {tpls.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setSel(t.key);
              setNote(null);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-medium ${sel === t.key ? "bg-white shadow-sm" : "text-[#6e6e73]"}`}
          >
            {NAMES[t.key] ?? t.key}
          </button>
        ))}
      </div>
      {cur && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="int-card grid gap-3 p-5">
            <label className="grid gap-1 text-[14px]">
              Asunto
              <input value={cur.subject} onChange={(e) => edit({ subject: e.target.value })} className="int-input" />
            </label>
            <label className="grid gap-1 text-[14px]">
              HTML
              <textarea value={cur.html} onChange={(e) => edit({ html: e.target.value })} rows={18} spellCheck={false} className="int-input font-mono text-[13px]" />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button key={v} type="button" onClick={() => navigator.clipboard?.writeText(`{{${v}}}`)} className="rounded-full bg-[#f2f2f7] px-2.5 py-1 font-mono text-[12px]" title="Copiar">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} className="btn-flame">
                Guardar
              </button>
              {note && <span className="text-[13px] text-[#6e6e73]">{note}</span>}
            </div>
          </div>
          <div className="int-card overflow-hidden">
            <p className="border-b border-black/[.06] px-4 py-2 text-[13px] text-[#86868b]">
              Vista previa · {renderTemplate(cur.subject, SAMPLE, { html: false })}
            </p>
            <iframe title="Vista previa" sandbox="" srcDoc={preview} className="h-[560px] w-full bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar** — `pnpm lint && pnpm typecheck && pnpm test`. En /internal:
  - Configuración: "actual: ••••xxxx" para el token; "Probar Telegram" → llega el mensaje a "General"; "Registrar webhook" → OK; cambiar `wait_minutes` y guardar → recargar y persiste.
  - Plantillas: editar el asunto de "Auto-respuesta al cliente" → la vista previa cambia en vivo; guardar → recargar y persiste; un `<script>` dentro del HTML no se ejecuta (iframe con `sandbox=""`).

- [ ] **Step 4: Commit** — `feat(internal): configuracion de telegram y resend y editor de plantillas`

---

### Task 13: Prueba punta a punta, documentación y deploy

**Files:**
- Modify: `CLAUDE.md` (ninja-soft-web), `next.config.mjs` (sólo el comentario)

- [ ] **Step 1: Build de producción en worktree aparte** (no romper el dev server)

```powershell
$w="$env:TEMP\nsw-build"; if (Test-Path "$w\node_modules") { cmd /c rmdir "$w\node_modules" }; if (Test-Path $w) { cmd /c rmdir /s /q $w }
git -C C:\Users\Lucas\Documents\ninja-soft-web worktree prune
git -C C:\Users\Lucas\Documents\ninja-soft-web worktree add --detach $w HEAD
cmd /c mklink /J "$w\node_modules" "C:\Users\Lucas\Documents\ninja-soft-web\node_modules"
cd $w; pnpm build *> build.log; $LASTEXITCODE; Get-Content build.log -Tail 20
```

Expected: exit `0`, rutas `/` e `/internal` como `○ (Static)`. Después: `cmd /c rmdir "$w\node_modules"; git -C C:\Users\Lucas\Documents\ninja-soft-web worktree remove --force $w`.

- [ ] **Step 2: Prueba punta a punta (dev server)** — con Telegram y (si está) Resend cargados:
  1. Chat: nuevo visitante → tema en Telegram → respuesta en vivo.
  2. Cerrar la pestaña, esperar > `away_minutes`, responder en Telegram → llega el email `chat_reply` (sólo si el dominio está verificado o el destinatario es el dueño de la cuenta Resend).
  3. Escribir con más de `wait_minutes` sin respuesta → aparece el aviso de espera.
  4. Formulario → tema "📥 Formularios" + email a `notify_email` (+ auto-respuesta si el dominio está verificado).
  5. `node scripts/check-rls.mjs` → `RLS OK` (ojo: con token cargado crea un tema "RLS Test · rls@test.com"; borrarlo después en Telegram).
  Limpiar datos de prueba con `scripts/sb.mjs`.

- [ ] **Step 3: Documentar en `CLAUDE.md`** — agregar sección:

```markdown
## Chat, contacto y /internal (2026-10-11)

- Backend: Supabase **Ninja Soft Web** (`tgaromemhaixgdsdlxiq`, sa-east-1). Migraciones en `supabase/migrations/`, se aplican con `node scripts/db-apply.mjs <archivo>` (Management API, requiere `SUPABASE_ACCESS_TOKEN`).
- Edge Functions (`supabase/functions/`): `chat-send`, `telegram-webhook`, `contact-submit`, `admin-settings`. Deploy: `npx -y supabase@2.120.0 functions deploy <fn> --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api`.
- Lógica en `_shared/*.ts` puros (tests con `pnpm test`); `index.ts` sólo cablea.
- Secretos en `app_secrets` (sin RLS pública). Se cargan desde /internal → Configuración o con `scripts/set-secret.mjs`.
- Telegram: grupo "Ninja Soft Chat Web" (`-1003773063419`), un tema por visitante + "📥 Formularios". Si se cambia el token: Configuración → Registrar webhook.
- Resend: hasta verificar `soft.ninja` en Resend (DNS en Namecheap) sólo salen mails al dueño de la cuenta; la auto-respuesta al cliente falla en silencio.
- Admin de /internal: `$env:ADMIN_PASSWORD='...'; node scripts/create-admin.mjs <email>`.
```

Y en `next.config.mjs` cambiar el comentario `// Sitio 100% estático: sin backend, se sirve desde el CDN de Vercel.` por `// Sitio estático en el CDN de Vercel; el backend (chat/contacto) vive en Supabase Edge Functions.`

- [ ] **Step 4: Commit** — `docs: chat, contacto y panel interno en CLAUDE.md`

- [ ] **Step 5: Merge y deploy — sólo cuando Lucas diga DEPLOYA**

```bash
git checkout main
git merge --no-ff feature/chat-contacto -F <archivo-con-mensaje>
git push origin main
```

Esperar el estado de Vercel: `gh api repos/Ninja-soft/ninja-soft-web/commits/<sha>/status --jq '.state'` → `success`. Probar en https://ninja-soft-web.vercel.app el chat y https://ninja-soft-web.vercel.app/internal.
