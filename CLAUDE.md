# CLAUDE.md · ninja-soft-web (soft.ninja)

Sitio de marca de Ninja Soft. Vende NinjaPOS, Ninja Food y Servicios a medida.
Hermanos: `..\ninja-soft-pos` (fuente de verdad de features y medios de pago) y `..\ninja-soft-food`.

## Stack y deploy
- Next.js 14 App Router, `output: "export"` (estático, sin backend) · TypeScript strict · Tailwind 3.4.
- Repo `Ninja-soft/ninja-soft-web` **público** (Vercel Hobby no deploya repos privados de org).
- Vercel: push a `main` = producción (`ninja-soft-web.vercel.app`). Dominio final `soft.ninja` (pendiente, DNS en Namecheap).
- Gate antes de commitear: `pnpm lint && pnpm typecheck && pnpm build`.

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
Todo el texto/datos en `lib/content.ts`. WhatsApp: `WHATSAPP_NUMBER` (pendiente número real).

## Referencias
- `docs/referencias/napse.md` · análisis de napse.global y qué trasladar.

## Pendientes
- Número de WhatsApp real · video Gemini · confirmar "Seller Manager"/"Simbel" · dominio soft.ninja.
- Rediseño "más pro" en curso, de a una sección (ver referencias).
