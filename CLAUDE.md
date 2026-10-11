# CLAUDE.md · ninja-soft-web (soft.ninja)

Sitio de marca de Ninja Soft. Vende NinjaPOS, Ninja Food y Servicios a medida.
Hermanos: `..\ninja-soft-pos` (fuente de verdad de features y medios de pago) y `..\ninja-soft-food`.

> **Leer primero `docs/contexto.md`**: arquitectura, IDs, DNS, base de datos, funciones, cómo se trabaja,
> reglas de diseño de Lucas y pendientes. Actualizarlo al cerrar cada tanda de cambios.

## Stack y deploy
- Next.js 14 App Router, `output: "export"` (estático; el backend vive en Supabase Edge Functions) · TypeScript strict · Tailwind 3.4.
- Repo `Ninja-soft/ninja-soft-web` **público** (Vercel Hobby no deploya repos privados de org).
- Vercel: push a `main` = producción en **https://soft.ninja** (www redirige; DNS en Namecheap).
- Gate antes de commitear: `pnpm lint && pnpm typecheck && pnpm test` (y `pnpm build` en un worktree aparte).

## Decisiones tomadas (2026-10-10)
- Dirección visual: **estructura Apple** (bloques full-bleed alternando claro `paper` / oscuro `night`,
  titulares grandes, un mensaje por bloque) **+ identidad Ninja** (fuego `#FF4B22→#FFD21F`, violeta profundo,
  Quicksand display (es la tipografía del wordmark "Ninja") / Inter / JetBrains Mono). Lucas eligió esto sobre la versión 100 % HIG.
- **Imágenes: siempre `.webp`, ordenadas en `public/images/<categoría>/`, kebab-case** (ver `public/images/README.md`,
  convertir con `scripts/to-webp.py`). Logos de terceros: buscarlos primero en `..\ninja-soft-pos` y en
  `..\GitHub\ANDESMAR\Img` (Logipaq) antes de bajarlos de internet.
- **Respetar los logos oficiales** de Ninja Soft, NinjaPOS y Ninja Food (`public/images/brand/`). Food mantiene su verde.
  Logos oficiales en `Dropbox\Ninja Soft\Logos` (OJO: ahí "Dark" = letras negras → nuestro `-light`;
  "Light" = letras blancas → nuestro `-dark`).
- Medios de pago con logos reales sobre fondo blanco (`public/images/payments/`), sacados del POS.
- Íconos de UI: **Phosphor** (`@phosphor-icons/react`, estilo `duotone`). Sin sombras en los íconos.
  Mercado Libre usa su logo real (`images/integrations/mercadolibre.webp`); inactivo = mismo logo en gris (transición suave, sin cambiar de dibujo).
- Mercado Libre es **eje comercial clave** (Lucas quiere orientarse ahí): darle presencia propia.
- Funciones del roadmap (ARCA, contabilidad, promociones, API pública) se muestran **como disponibles**
  por decisión comercial de Lucas; quedan marcadas `roadmap: true` en `lib/content.ts`.
- Marcas de terceros en "Experiencia" sólo como texto, nunca logos (no implican alianza).
- Hero preparado para video del isotipo: `public/videos/hero.mp4` (si no existe, imagen fija).

## Contenido
Todo el texto/datos en `lib/content.ts` (incluye `FAQ`). Ya no hay WhatsApp: el contacto es el chat web (Telegram) y el formulario (Resend).

## Referencias
- `docs/contexto.md` · contexto completo del proyecto.
- `docs/referencias/napse.md` · análisis de napse.global y qué trasladar.

## Pendientes
- Ver `docs/contexto.md` § 11.

## Chat, contacto y /internal (2026-10-11)

- Backend: Supabase **Ninja Soft Web** (`tgaromemhaixgdsdlxiq`, sa-east-1, org Free "Ninja Soft Internal"). Migraciones en `supabase/migrations/`, se aplican con `node scripts/db-apply.mjs <archivo>` (Management API, requiere `SUPABASE_ACCESS_TOKEN`). Nunca tocar los proyectos de POS/Food desde acá.
- Edge Functions (`supabase/functions/`): `chat-send`, `telegram-webhook`, `contact-submit`, `admin-settings`, `chat-purge`. Deploy: `npx -y supabase@2.120.0 functions deploy <fn> --project-ref tgaromemhaixgdsdlxiq --no-verify-jwt --use-api` (validan usuario/secreto adentro).
- Lógica en `_shared/*.ts` puros con dependencias inyectadas (tests: `pnpm test`); los `index.ts` sólo cablean Supabase/Telegram/Resend.
- Secretos en `app_secrets` (sin políticas RLS; sólo service_role). Se cargan desde /internal → Configuración o con `scripts/set-secret.mjs`. Nunca imprimirlos ni commitearlos.
- Telegram: grupo "Ninja Soft Chat Web" (`-1003773063419`) con Temas, bot `@Ninja_soft_bot`. Un tema por visitante ("Nombre · email") + tema "📥 Formularios". Fotos ida y vuelta (bucket privado `chat-media`, carpeta = id de sesión). Si cambia el token: Configuración → Registrar webhook.
- Resend: dominio `soft.ninja` verificado; remitente `Ninja Soft <hola@soft.ninja>`. Emails de aviso configurables (varios, separados por coma).
- Retención: el chat (mensajes + fotos) se borra a los 15 días sin actividad — pg_cron `purge-old-chats` llama a `chat-purge` con `cron_secret`.
- Admin de /internal: `$env:ADMIN_PASSWORD='...'; node scripts/create-admin.mjs <email>`.
- Prueba de aislamiento: `node scripts/check-rls.mjs` (con el token cargado crea un tema "RLS Test" en Telegram: borrarlo después).

### Logos por unidad de negocio (Cloudinary, para emails)

- Ninja Soft: `https://res.cloudinary.com/dl6yhrcx0/image/upload/f_auto,q_auto/Ninja_Soft_Logo_tft2oy`
- NinjaPOS: `https://res.cloudinary.com/dl6yhrcx0/image/upload/f_auto,q_auto/Ninja_Pos_Logo_pmxzew`
- Ninja Food: pendiente (ajuste `logo_food_url`).
- Isotipo naranja PNG (emails): `https://tgaromemhaixgdsdlxiq.supabase.co/storage/v1/object/public/brand/ninja-isotipo-flame.png`
- Los logos de Cloudinary son para fondo oscuro (texto blanco). En plantillas: `{{logo_soft}}`, `{{logo_pos}}`, `{{logo_food}}` (se editan en /internal → Ajustes).

## /internal v2, medición, contactos, campañas y SEO (2026-10-11)

- /internal: tema oscuro "void" igual al interno de NinjaPOS (`.ix*` en globals.css, piezas en `components/internal/ui.tsx`). Secciones por hash (`#estadisticas`, `#chats`, …). Nunca "—": usar `<NoData />` (ícono). Sin `window.confirm`: confirmaciones en pantalla.
- Medición propia sin cookies: `lib/track.ts` + `components/Analytics.tsx` → Edge Function `track` → `page_events`. Visitante = hash diario (IP + navegador + `analytics_salt`). No mide en localhost/192.168.* salvo `?track=1`. Estadísticas: RPC `internal_stats(días)`.
- Contactos para remarketing: se crean solos desde chat y formulario (`upsert_contact`, nunca reactiva una baja; un trigger impide re-suscribir desde el panel).
- Campañas: Edge Function `campaign` (test / start / send_batch). Lotes de 100 reclamados con `campaign_claim` + Idempotency-Key; 429/5xx de Resend dejan pendientes y frenan. Borradores editables. Baja: el link lleva a `/baja?t=…` y se confirma con un botón (POST); también one-click de Gmail.
- SEO: metadatos en `app/layout.tsx`, `robots.ts`, `sitemap.ts`, JSON-LD en `components/StructuredData.tsx`, FAQ en `lib/content.ts` (`FAQ`). URL canónica `https://soft.ninja` en `lib/site.ts`.
- Dominios (2026-10-11): soft.ninja → ninja-soft-web (www redirige 308), pos.soft.ninja → ninja-soft-pos, food.soft.ninja → ninja-soft-food. DNS en Namecheap (A @ 76.76.21.21, CNAME www/pos/food → cname.vercel-dns.com); no tocar los registros de Resend (send, resend._domainkey, _dmarc). Supabase site_url de los tres proyectos apunta a los dominios nuevos.
- Seguridad: `vercel.json` con CSP (sólo Supabase y Cloudinary), HSTS con preload, X-Frame-Options DENY, etc. Si se suma un servicio externo, agregarlo a la CSP.
- Rendimiento: el chat (supabase-js) se carga recién al usarlo (`ChatLauncher`); imágenes de abajo con `loading="lazy"`; la animación del celular descarga sus cuadros al acercarse.
