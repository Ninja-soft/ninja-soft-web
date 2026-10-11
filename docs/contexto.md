# Contexto del proyecto · ninja-soft-web (soft.ninja)

> Documento vivo. Leerlo antes de tocar el sitio o el panel interno. Última actualización: **2026-10-11**.
> Las reglas cortas para Claude viven en `CLAUDE.md`; acá está el contexto completo: qué hay, dónde y por qué.

---

## 1. Qué es

Sitio de marca de **Ninja Soft** (Rosario, Argentina). Vende tres líneas:

| Línea | Qué es | Dónde vive |
|---|---|---|
| **NinjaPOS** | Punto de venta SaaS multi-tenant | `..\ninja-soft-pos` · https://pos.soft.ninja |
| **Ninja Food** | Trazabilidad y gestión bromatológica (aval ABR) | `..\ninja-soft-food` · https://food.soft.ninja |
| **Servicios a medida** | Integraciones (Mercado Libre, ecommerce, ERP/WMS) y desarrollos | este sitio |

Además del sitio público incluye:
- **Chat web en vivo** respondido desde Telegram.
- **Formulario de contacto** con emails de Resend.
- **Medición propia de visitas.**
- **Base de contactos y campañas por email.**
- **Panel interno** en `/internal`.

Datos de la empresa usados en el sitio: Urquiza 3164, Rosario, Santa Fe · Instagram `@ninjasoft.latam` · email de avisos `ninjasoft2026@gmail.com`.

---

## 2. Arquitectura

```
Navegador ──► soft.ninja (Vercel, Next.js 14 estático: output "export")
   │
   ├─ chat / formulario / medición / baja ──► Supabase "Ninja Soft Web" (Edge Functions + Postgres + Realtime + Storage)
   │                                              ├─► Telegram Bot API (grupo con temas)
   │                                              └─► Resend (emails desde hola@soft.ninja)
   └─ /internal (login Supabase Auth) ───────► mismas tablas con RLS + Edge Functions de admin
```

- **El sitio es estático**: no hay API routes de Next. Todo lo que es servidor está en Supabase Edge Functions (Deno).
- **Lógica de negocio pura** en `supabase/functions/_shared/*.ts`, con dependencias inyectadas y testeada con Vitest (`pnpm test`). Los `index.ts` de cada función sólo cablean Supabase, Telegram y Resend.
- **Stack**:
  - Next.js 14.2 (App Router), TypeScript strict, Tailwind 3.4, pnpm 9.15.9.
  - Íconos: `@phosphor-icons/react`. Gráficos de `/internal`: ECharts 5.5.1.
  - Cliente de Supabase: `@supabase/supabase-js` 2.45.4.

---

## 3. Infraestructura e identificadores

| Recurso | Valor |
|---|---|
| Repo | `Ninja-soft/ninja-soft-web` (**público**: Vercel Hobby no deploya repos privados de org) |
| Vercel | proyecto `ninja-soft-web` · push a `main` = producción |
| Dominio | `soft.ninja` (Namecheap). `www` redirige 308 a `soft.ninja` |
| Supabase | proyecto **Ninja Soft Web** · ref `tgaromemhaixgdsdlxiq` · sa-east-1 · org Free "Ninja Soft Internal" |
| Publishable key | `sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn` (pública, va en el bundle) |
| Telegram | bot `@Ninja_soft_bot` · grupo "Ninja Soft Chat Web" `-1003773063419` (Temas activados) |
| Resend | dominio `soft.ninja` verificado · remitente `Ninja Soft <hola@soft.ninja>` |
| Logos para emails | Cloudinary `dl6yhrcx0` (ver §9) e isotipo PNG en el bucket público `brand` de Supabase |

**Otros proyectos de Supabase (no tocar desde acá):** NinjaPOS `hrkditzrsavehnhngakb` y Ninja Food `skitcpzszonyybeqymzd`, ambos en la org Pro "Ninja Soft".

**Secretos** (nunca en el repo ni impresos):
- Viven en la tabla `app_secrets`, que no tiene políticas RLS: sólo la lee `service_role`.
  - `telegram_bot_token`, `resend_api_key`, `telegram_webhook_secret`, `cron_secret`, `analytics_salt`
- Copias locales de Lucas: `%USERPROFILE%\.ninja-telegram-token` y `%USERPROFILE%\.ninja-resend-key`.
- Se cargan desde /internal → Configuración o con `scripts/set-secret.mjs`.

### DNS (Namecheap → Advanced DNS)

| Tipo | Host | Valor |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com.` |
| CNAME | `pos` | `cname.vercel-dns.com.` (proyecto ninja-soft-pos) |
| CNAME | `food` | `cname.vercel-dns.com.` (proyecto ninja-soft-food) |
| MX / TXT | `send`, `resend._domainkey`, `_dmarc` | **de Resend: no tocar** |

- Vercel recomienda las IP nuevas (`216.198.79.1`); las actuales siguen funcionando.
- `site_url` de Supabase Auth en los tres proyectos apunta a los dominios nuevos; las direcciones de vercel.app siguen permitidas.

---

## 4. Estructura del repo

```
app/
  page.tsx              sitio público (orden de secciones)
  layout.tsx            fuentes, metadatos SEO, preconnect a Supabase
  internal/             panel /internal (página estática, noindex)
  baja/                 confirmación de baja de campañas (noindex)
  robots.ts · sitemap.ts
components/
  Nav, Hero, HeroPillars, PillarShowcase, showcase/   hero y pilares animados
  PosShowcase           keynote del celular (43 cuadros en public/images/showcase/pos-frames)
  PosSection + rubros/  "Hecho para tu rubro" (escenas por rubro, arrancan al llegar a la sección)
  Payments              medios de pago (tira deslizable en celular)
  Features              "Menos planillas. Más ventas." (fondo oscuro)
  FoodSection + food/FoodFlow   Ninja Food con canvas de trazabilidad tipo n8n
  ServicesAbout, Closing (Experiencia, Contacto, Footer), Process, Faq
  chat/                 ChatLauncher (liviano) → ChatWidget (carga diferida), ChatImage
  ContactForm, Analytics, StructuredData, ScrollHint, ScrollArrows, BlinkAvatar, Year
  internal/             InternalApp (shell) + pestañas + ui.tsx + EChart.tsx
lib/
  content.ts            textos y datos del sitio (productos, medios de pago, FAQ, dirección…)
  site.ts               SITE_URL (https://soft.ninja)
  track.ts              medición (sendBeacon)
  supabase/config.ts    URL, publishable key y callFunction (sin supabase-js)
  supabase/client.ts    visitorClient / internalClient (supabase-js; sesiones separadas)
supabase/
  migrations/           SQL versionado (se aplica con scripts/db-apply.mjs)
  functions/            Edge Functions + _shared (lógica pura testeada)
scripts/                helpers de Management API, secretos, webhook, admins, prueba de RLS
tests/                  Vitest (lógica de _shared)
docs/                   este contexto, specs y planes (docs/superpowers), referencias
```

---

## 5. Funcionalidades

### Sitio público

- **Hero, keynote del POS, rubros, medios de pago, funciones, Ninja Food, servicios, quiénes somos, cómo trabajamos, FAQ y contacto.**
- **Chat web:**
  - Pide nombre y email.
  - Cada visitante abre un tema propio en el grupo de Telegram; Lucas responde ahí y la respuesta llega en vivo.
  - Si el visitante se fue, la respuesta le llega por email.
  - Fotos en ambos sentidos (bucket privado `chat-media`, 5 MB, compresión en el navegador) y visor de fotos.
  - Botón "Nuevo chat".
  - Retomar la conversación en otro navegador con un PIN de 6 dígitos por email.
  - Retención: 15 días sin actividad, después se borra todo, fotos incluidas (pg_cron → `chat-purge`).
- **Formulario de contacto:**
  - Campos: nombre, email, teléfono, empresa, rubro (chips) y la opción de reunión por Teams con horario preferido.
  - Avisa por email a los destinatarios de `notify_email`, que pueden ser varios.
  - Responde al cliente con la plantilla `contact_ack` y avisa en el tema "📥 Formularios" de Telegram.
- **Medición propia sin cookies**: visitas, visitantes únicos por día, secciones vistas, profundidad de scroll, clics en llamados a la acción, apertura del chat, mensajes y formularios. Fuente por UTM, `gclid` (Google Ads) o referrer.
- **Baja de campañas**: el link del email lleva a `/baja?t=…` y se confirma con un botón. También funciona la baja one-click de Gmail/Outlook.

### Panel `/internal`

- **Estética del interno de NinjaPOS** (tema oscuro "void"): barra lateral, perfil con iniciales, footer, spinners.
- **Acceso**: login con email y contraseña, "Olvidé mi contraseña", invitaciones del equipo y cierre de sesión a las 8 h de inactividad.
- **Secciones** (por hash, por ejemplo `/internal#chats`):
  - **Inicio**: KPIs, gráfico de 14 días, últimos chats y accesos a los internos de NinjaPOS y Ninja Food.
  - **Estadísticas** (ECharts, 7/30/90 días): tráfico, embudo, fuentes, dispositivos, secciones, scroll, clics y campañas UTM.
  - **Chats**: estilo mensajería, en vivo, buscador y botón "Responder en Telegram".
  - **Contactos**: tabla, filtros, exportación a CSV y "dar de baja" con confirmación. Pestaña de consultas del formulario.
  - **Campañas**: editor HTML con vista previa, email de prueba, borradores y envío por lotes con progreso y reanudación.
  - **Plantillas**: emails automáticos editables con vista previa en vivo.
  - **Equipo**: invitar y quitar accesos.
  - **Configuración**: Telegram y Resend con sus logos, ajustes, URLs y logos por marca.

---

## 6. Base de datos (Supabase "Ninja Soft Web")

| Tabla | Para qué | Quién la lee |
|---|---|---|
| `chat_sessions`, `chat_messages` | chat (realtime) | el visitante sólo lo suyo; admins todo |
| `chat_pins` | PIN para retomar el chat | sólo service_role |
| `contact_requests` | consultas del formulario | admins |
| `contacts` | base de remarketing (chat + formulario) | admins (sólo pueden dar de baja) |
| `campaigns`, `campaign_recipients` | campañas y destinatarios | admins (borradores editables) |
| `page_events` | medición de visitas | sólo service_role; admins vía `internal_stats` |
| `email_templates` | `contact_ack`, `contact_notify`, `chat_reply` | admins |
| `app_settings` | ajustes no secretos | admins |
| `app_secrets` | secretos | sólo service_role |
| `rate_events` | límites de uso | sólo service_role |
| `internal_admins` | quién entra a /internal | cada uno se ve a sí mismo |

**RPCs principales:**
- `is_admin()`
- `chat_touch()` y `chat_close()`
- `get_public_config()`
- `upsert_contact(jsonb)`: nunca reactiva una baja.
- `internal_stats(días)`
- `internal_chat_list()`
- `internal_team()`
- `campaign_start(...)`
- `campaign_claim(campaña, límite)`: reclama lotes con `FOR UPDATE SKIP LOCKED`.
- `purge_old_chats()`
- `purge_old_events()`: 13 meses.

**Triggers y crons:**
- Trigger `contacts_protect_unsubscribe`: una baja no se revierte desde el panel.
- Crons: `purge-old-chats` (diario, llama a `chat-purge`) y `purge-old-events` (semanal).

**Edge Functions** (todas con `verify_jwt = false`; validan usuario o secreto adentro):

| Función | Qué hace |
|---|---|
| `chat-send` | mensajes y fotos del visitante a Telegram; crea el contacto |
| `telegram-webhook` | respuestas desde Telegram (texto y fotos) al chat y, si el visitante se fue, por email |
| `chat-resume` | pedir y validar el PIN para retomar el chat |
| `chat-purge` | retención de 15 días (la llama el cron) |
| `contact-submit` | formulario: guarda, emails, aviso en Telegram, crea el contacto |
| `track` | medición (límite 120 pedidos cada 10 min por visitante) |
| `unsubscribe` | GET redirige a `/baja`; POST da de baja |
| `campaign` | campañas: prueba, inicio, envío por lotes |
| `admin-settings` | configuración, pruebas, webhook, equipo e invitaciones |

---

## 7. Cómo se trabaja

**Comandos:**

```bash
pnpm dev --port 3100 --hostname 0.0.0.0   # local y LAN (http://192.168.100.77:3100)
pnpm lint && pnpm typecheck && pnpm test  # antes de commitear
node scripts/db-apply.mjs supabase/migrations/<archivo>.sql            # aplicar una migración (Management API)
npx -y supabase@2.120.0 functions deploy <fn> --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api
node scripts/set-secret.mjs <telegram_bot_token|resend_api_key> <archivo>
$env:ADMIN_PASSWORD='...'; node scripts/create-admin.mjs <email>      # en PowerShell de Lucas
```

**Reglas de trabajo:**
- `SUPABASE_ACCESS_TOKEN` tiene que estar en el ambiente para los scripts y la CLI.
- **Build de producción**: hacerlo en un worktree aparte (`%TEMP%\nsw-...` con `node_modules` enlazado). Compilar en la carpeta del dev server lo rompe. Si el dev server queda sirviendo código viejo, pararlo, borrar `.next` y relanzarlo.
- **Deploy**: Lucas lo pide con "DEPLOYA". Commit con `git commit -F archivo` (PowerShell rompe las comillas), después push a `main`, después esperar el estado de Vercel (`gh api repos/Ninja-soft/ninja-soft-web/commits/<sha>/status`).
- **Pruebas en el navegador**: Playwright-core con el Chrome del sistema; los scripts viven en el scratchpad de la sesión.
- **Datos de prueba**:
  - Borrar después de usarlos: sesiones `Prueba…`, sus temas de Telegram y sus fotos.
  - Las visitas de prueba también: en localhost no se mide salvo con `?track=1`, pero las pruebas contra producción sí cuentan.
- **TDD** para la lógica de `_shared`: la prueba se escribe primero y se ve fallar.

---

## 8. Reglas y preferencias de Lucas (diseño y producto)

**Estética general:**
- Estructura e interacción estilo **Apple/iOS** con identidad Ninja (fuego `#FF4B22 → #FF8A1F → #FFD21F`, violeta noche `#0B0720`).
- Tipografías: Quicksand (display), Inter (texto), JetBrains Mono, Unbounded para "POS".
- Animaciones fluidas, sólo con `transform`/`opacity`. Respetan "reducir movimiento" y arrancan al entrar en pantalla.
- Mobile-first: probar siempre a 390 px, sin scroll lateral.

**Logos e imágenes:**
- **Logos oficiales siempre.** Imágenes **siempre en WebP** en `public/images/<categoría>/`, en kebab-case.
- Logos de terceros: buscarlos primero en `..\ninja-soft-pos` y en `..\GitHub\ANDESMAR\Img`.
- Las marcas de terceros en "Experiencia" van sólo como texto.

**Cosas a evitar:**
- **Bordes de color redondeados.** Para resaltar, usar fondo o relleno.
- **"—"** en /internal: cuando no hay dato va `<NoData />`, con ícono y "Sin datos".
- **Alertas del navegador** (`alert`/`confirm`): las confirmaciones van en pantalla, con el texto arriba y los botones abajo.

**Contenido y producto:**
- **Mercado Libre** es eje comercial clave.
- Las funciones del roadmap (ARCA, contabilidad, promociones, API) se muestran **como disponibles**, por decisión comercial.
- Ninja Food mantiene su verde (fondo de sección verde de marca).
- El año del footer siempre es el actual (componente `Year`).
- El botón de chat del menú es el avatar animado del isotipo (ojos que se abren y se cierran) más "Hablemos".
- Campañas: van a **todos** los contactos, con link de baja obligatorio que se respeta. Medición **propia**, sin cookies.

---

## 9. Logos por unidad de negocio (Cloudinary `dl6yhrcx0`, para emails)

En PNG con `f_png,h_120` en la URL. `_Light` = texto blanco (fondo oscuro), `_Dark` = texto negro (fondo claro):

| Marca | Fondo oscuro | Fondo claro |
|---|---|---|
| Ninja Soft | `Ninja_Soft_Light_xmwwrs` | `Ninja_Soft_Dark_h9aklw` |
| NinjaPOS | `Ninja_POS_Light_glckmm` | `Ninja_POS_Dark_majzi0` |
| Ninja Food | `Ninja_Food_Light_ezz6ah` | `Ninja_Food_Dark_cxz0ec` |

URL base: `https://res.cloudinary.com/dl6yhrcx0/image/upload/f_png,h_120/<id>`.

En las plantillas se usan `{{logo_soft}}`, `{{logo_pos}}` y `{{logo_food}}` para fondo oscuro, y `{{logo_soft_claro}}`, `{{logo_pos_claro}}` y `{{logo_food_claro}}` para fondo claro. Se editan en /internal → Configuración.

En los archivos de Dropbox (`Dropbox\Ninja Soft\Logos`), "Dark" = letras negras, que en este repo es `-light`.

---

## 10. SEO y rendimiento

- **SEO:**
  - Título, descripción y keywords orientados a "sistema POS", "punto de venta", "programa para kiosco", "sistema para restaurante", "factura electrónica ARCA/AFIP" y "Mercado Pago Point".
  - Canonical `https://soft.ninja`, `robots.txt` (excluye `/internal` y `/baja`) y `sitemap.xml`.
  - JSON-LD (Organization, WebSite, 2 SoftwareApplication, FAQPage) e imagen para compartir `public/og.jpg`.
- **Lighthouse en producción (2026-10-11):** celular 83 · computadora 98 · accesibilidad 97 · buenas prácticas 100 · SEO 100.
- **Claves de rendimiento:**
  - El chat (supabase-js) se carga al usarlo.
  - Las imágenes de más abajo usan `loading="lazy"`.
  - La animación del celular baja sus cuadros recién al acercarse.
  - El isotipo animado entra después de la carga.
  - ECharts sólo se carga en /internal.
- **Seguridad** (`vercel.json`): CSP (sólo Supabase y Cloudinary), HSTS con preload, X-Frame-Options DENY, nosniff, Referrer-Policy y Permissions-Policy. **Si se suma un servicio externo, agregarlo a la CSP.**
- **Google Search Console**: propiedad Dominio `soft.ninja` verificada por TXT en Namecheap. Sitemap: `https://soft.ninja/sitemap.xml`.

---

## 11. Pendientes

- **NinjaPOS y Ninja Food**: pasar a `pos.soft.ninja` y `food.soft.ninja` las URLs `*.vercel.app` que tienen escritas en sus mails y en `APP_URL`. Son cambios en esos repos.
- **Raíz de `pos.soft.ninja`**: responde 307 sin destino (también en vercel.app); revisar en ese proyecto.
- **Contraseña de `/internal` de Lucas**: cambiarla. La actual se compartió por chat y aparece en filtraciones.
- **Rotar la API key de Resend**: la anterior se compartió por chat.
- **HSTS preload**: no se envió a la lista de precarga; hacerlo sólo si se confirma que todos los subdominios usan HTTPS.
- **Deudas menores de revisión:**
  - El webhook de Telegram no avisa si falla una entrega.
  - Documentos, videos y ediciones desde Telegram se ignoran.
  - Los epígrafes de fotos se cortan a 1024 caracteres.
  - Las imágenes de otros dominios no se ven en la vista previa de campañas por la CSP.
- **Datos por confirmar**: "Seller Manager"/"Simbel" en Experiencia.

---

## 12. Historial de documentos

- Spec del chat, el contacto y /internal: `docs/superpowers/specs/2026-10-11-chat-contacto-internal-design.md`
- Planes: `docs/superpowers/plans/2026-10-11-chat-contacto-internal.md` y `docs/superpowers/plans/2026-10-11-internal-v2.md`
- Referencias de diseño: `docs/referencias/napse.md`
