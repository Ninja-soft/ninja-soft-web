# public/images

Todas las imágenes del sitio viven acá, **siempre en `.webp`**, nombre en minúsculas y kebab-case.

```
images/
├── brand/                     # marcas propias (Ninja Soft, NinjaPOS, Ninja Food)
│   ├── ninjasoft-logo-light.webp   # para fondo claro
│   ├── ninjasoft-logo-dark.webp    # para fondo oscuro
│   ├── ninjapos-logo-light.webp
│   ├── ninjapos-logo-dark.webp
│   ├── ninjafood-logo-light.webp
│   ├── ninja-isotipo-black.webp
│   └── ninja-isotipo-white.webp
├── payments/
│   ├── processors/            # procesadores y billeteras (Mercado Pago, MODO, Payway…)
│   └── networks/              # tarjetas y redes de cobro (Visa, Mastercard, Rapipago…)
├── integrations/              # plataformas que integramos (Mercado Libre, Rappi, PedidosYa, Nubceo, VTEX…)
└── products/                  # fotos de producto de ejemplo (Unsplash, sin marcas visibles)
```

Convenciones:
- Logos con variante por fondo: sufijo `-light` (para fondo claro) / `-dark` (para fondo oscuro).
- Terceros: nombre de la marca sin espacios (`mercadopago.webp`, `naranjax.webp`).
- Convertir con `python scripts/to-webp.py <origen> <destino.webp> --width 640`.
- SVG: rasterizar primero con Chrome headless (fondo transparente) y después `to-webp.py`.

Videos en `public/videos/` (`hero.mp4`).
