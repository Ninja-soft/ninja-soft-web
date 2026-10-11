# Chat web → Telegram, formulario de contacto y panel /internal

Fecha: 2026-10-11 · Estado: **en revisión**

## Objetivo

Reemplazar los botones de WhatsApp de soft.ninja por:

1. **Chat web** cuyas conversaciones llegan a Telegram (un tema por visitante) y se responden desde ahí.
2. **Formulario de contacto** que avisa a Lucas por email y Telegram y le responde al cliente con una plantilla de Resend.
3. **Panel `/internal`** con login, donde se configuran Telegram, Resend, las plantillas HTML y sus variables, se ven chats y contactos, y hay accesos directos a los paneles internos de NinjaPOS y Ninja Food.

Éxito = un visitante escribe en la web, Lucas lo lee y responde desde Telegram, el visitante ve la respuesta en vivo (o por email si se fue), y todo se configura sin tocar código.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Backend | Proyecto Supabase **Ninja Soft Web** (`tgaromemhaixgdsdlxiq`, sa-east-1, org Free), separado de POS y Food |
| Sitio | Sigue **estático** (`output: "export"`) en Vercel; todo lo servidor vive en Edge Functions |
| Telegram | Grupo "Ninja Soft Chat Web" (`-1003773063419`) con Temas; bot `@Ninja_soft_bot` admin con "Administrar temas" |
| Inicio de chat | Pide **nombre + email o teléfono** antes del primer mensaje |
| Sin respuesta | Aviso en el chat a los 5 min + tus respuestas también por **email** si el visitante no está en la página |
| Acceso a POS/Food | **Accesos directos** desde /internal; cada panel conserva su propio login |

## Arquitectura

```
Navegador (soft.ninja)                Supabase "Ninja Soft Web"                 Externos
───────────────────────               ─────────────────────────                 ─────────
ChatWidget ── signInAnonymously ──▶   Auth (anónimo)
           ── chat-send ──────────▶   Edge Fn chat-send ──────────────────────▶ Telegram (tema)
           ◀─ Realtime (mensajes) ─   tabla chat_messages ◀── Edge Fn telegram-webhook ◀── Telegram
                                                          └─ visitante ausente ─▶ Resend (respuesta)
ContactForm ── contact-submit ─────▶  Edge Fn contact-submit ── Resend (a Lucas + auto-respuesta)
                                                              └─ Telegram (aviso)
/internal ── login email+password ─▶  Auth + tabla internal_admins
          ── admin-settings ───────▶  Edge Fn admin-settings ── tabla app_secrets (solo service_role)
```

### Datos (migraciones versionadas en `supabase/migrations/`)

- `chat_sessions`: id uuid, `user_id` (auth anónimo), nombre, contacto (email/teléfono), `telegram_thread_id`, `last_seen_at` (latido del widget), `created_at`, `closed_at`.
- `chat_messages`: id uuid, `session_id`, `sender` (`visitor` | `agent` | `system`), texto, `telegram_message_id`, `emailed_at`, `created_at`.
- `contact_requests`: id uuid, nombre, email, teléfono, rubro, mensaje, ip_hash, `created_at`, estado (`nuevo` | `respondido`).
- `email_templates`: `key` (`contact_ack`, `contact_notify`, `chat_reply`), asunto, HTML, `updated_at`.
- `app_settings`: valores **no secretos** (email de aviso, remitente, nombre del remitente, minutos de espera, horario, links de POS/Food internal).
- `app_secrets`: token del bot, API key de Resend, secreto del webhook. **RLS sin políticas**: sólo la lee `service_role` desde las Edge Functions; nunca vuelve al navegador (el panel muestra `••••1234`).
- `internal_admins`: `user_id` de quien puede entrar a /internal.

### RLS

- Visitante (anónimo): `select` de su `chat_sessions` / `chat_messages` donde `user_id = auth.uid()`. No inserta directo: escribe vía `chat-send`.
- Admin: `select/update` sobre chats, contactos, plantillas y `app_settings` si `auth.uid()` está en `internal_admins`.
- `app_secrets`: ninguna política (sólo `service_role`).

### Edge Functions

| Función | Qué hace |
|---|---|
| `chat-send` | Valida sesión anónima, nombre/contacto, honeypot y límite (p. ej. 20 msj / 10 min por sesión, 60 / hora por IP). Crea el tema en Telegram la primera vez ("Nombre · contacto") y reenvía el mensaje. |
| `telegram-webhook` | Verifica `X-Telegram-Bot-Api-Secret-Token` y el ID del grupo. Mensaje humano dentro de un tema → `chat_messages` (`agent`) → llega por Realtime. Si `last_seen_at` > 2 min, manda la respuesta por email (`chat_reply`) con `reply_to` = email de Lucas. |
| `contact-submit` | Honeypot + límite por IP; guarda en `contact_requests`; email `contact_notify` a Lucas, `contact_ack` al cliente y aviso en Telegram (tema "Formularios"). |
| `admin-settings` | Sólo admins. Lee/guarda secretos enmascarados, registra el webhook de Telegram, **prueba de envío** (Telegram y Resend) y vista previa de plantillas. |

### Plantillas

HTML editable en /internal con variables `{{nombre}}`, `{{email}}`, `{{telefono}}`, `{{rubro}}`, `{{mensaje}}`, `{{respuesta}}`, `{{fecha}}`, `{{link_sitio}}`. Las variables se escapan (anti-inyección HTML) antes de reemplazar. Plantillas iniciales con la marca Ninja Soft (logo naranja, tipografía del sitio).

## UI

- **ChatWidget** (todas las páginas): burbuja abajo a la derecha, panel estilo iOS. Paso 1 nombre + contacto; paso 2 conversación; aviso a los 5 min sin respuesta. En mobile ocupa pantalla completa. Reemplaza los CTA de WhatsApp (botones "Escribir por WhatsApp" → "Abrir chat").
- **ContactForm** en la sección "Hablemos": nombre, email, teléfono (opcional), rubro (select), mensaje. Estados enviando / enviado / error.
- **`/internal`** (página estática, `noindex`, login con email + contraseña de Supabase):
  - Inicio: accesos directos **Internal NinjaPOS** y **Internal Ninja Food** + contadores (chats abiertos, contactos nuevos).
  - Chats: lista y detalle (sólo lectura; se responde desde Telegram).
  - Contactos: lista, marcar respondido.
  - Configuración: Telegram (token, grupo, registrar webhook, probar), Resend (API key, remitente, email de aviso, probar), tiempos.
  - Plantillas: editor HTML con vista previa en vivo y lista de variables.
- El usuario admin inicial: Lucas (se crea por script y se agrega a `internal_admins`).

## Dependencias externas

- **Resend**: cuenta + API key + dominio `soft.ninja` verificado (DNS en Namecheap). Hasta verificarlo, sólo se puede enviar al email del dueño de la cuenta: el auto-respuesta al cliente queda inactivo.
- Variables públicas en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase: habilitar **Anonymous sign-ins** y limitar sign-ups por email (sólo admins creados por script).

## Fuera de alcance

- Login único entre web, POS y Food.
- Respuestas automáticas con IA.
- Responder chats desde /internal (se responde desde Telegram; se puede sumar después).
- Adjuntos (imágenes/archivos) en el chat.

## Pruebas

- Unitarias (Vitest): reemplazo y escape de variables, validaciones, rate limit.
- RLS: un visitante no ve chats ajenos; anónimo no lee `app_secrets` ni plantillas.
- Punta a punta manual: chat → tema en Telegram → respuesta → aparece en vivo; cerrar pestaña → respuesta por email; formulario → 2 emails + aviso.
