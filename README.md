# Ninja Soft · soft.ninja

Sitio de marca de Ninja Soft: presenta NinjaPOS, Ninja Food y los servicios a medida.

Next.js 14 (App Router, export estático) · TypeScript · Tailwind CSS 3.4 · Vercel.

## Desarrollo

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # genera out/ (sitio estático)
pnpm lint && pnpm typecheck
```

## Dónde se cambia cada cosa

| Qué | Archivo |
|---|---|
| Número de WhatsApp, URLs de POS y Food | `lib/content.ts` |
| Medios de pago, rubros, funciones, proceso | `lib/content.ts` |
| Colores y tipografías de marca | `tailwind.config.ts`, `app/layout.tsx` |
| Logos | `public/brand/`, `public/pay/` |
| Video del hero | `public/brand/hero.mp4` (si existe se reproduce; si no, imagen fija) |

## Deploy

Push a `main` → Vercel publica producción. Cada PR genera un preview.
