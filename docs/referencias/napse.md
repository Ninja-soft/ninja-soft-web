# Referencia: napse.global (TOTVS Napse)

Analizado: 2026-10-10. Napse es el competidor/referente directo de NinjaPOS en retail
(Lucas implementó Napse). Su home es el benchmark de "cómo se ve un POS enterprise".

## Estructura de su home (en orden)

1. **Nav**: logo · Soluciones (dropdown por categoría) · Quiénes somos · Casos de éxito ·
   Partners · Blog · Contacto · "Quiero ser partner".
2. **Hero**: video full-screen (violeta) + "Napse ahora es TOTVS" ·
   "De pequeños comercios a grandes cadenas de retail, acompañamos tu crecimiento." ·
   CTA "Descubre nuestras soluciones".
3. **"Confían en nosotros"**: muro de ~20 logos de clientes (Farmacity, Electrolux,
   Costco, Frávega, Disney Store, Sephora, Lacoste, Motorola, Sears, Novogar…).
4. **Video institucional** embebido (YouTube).
5. **"Nuestras soluciones"**: tabs verticales a la izquierda + panel oscuro a la derecha.
   Suite con nombre propio por producto:
   - Napse Omni (POS omnicanal) · Napse Promo (promociones y fidelización) ·
     Napse VTOL (medios de pago) · Napse Fiscal Flow (facturación) ·
     Napse Bridge (integración ecommerce/marketplace).
6. **"Tenemos una solución para cada segmento"**: tabs por vertical (Supermercados,
   Oil & Gas, Moda, Farmacias, Tiendas Departamentales) + texto + **foto de personas reales**.
7. **Banda CTA** oscura a mitad de página: "Habla con un especialista…" + Contáctanos.
8. **"Casos de éxito"**: tabs por cliente (NBA Argentina, La Yunta, Ferniplast,
   Liverpool, C&A, Grupo Martí) con **resultados cuantificados** (95 % más rápido,
   450+ PDV, 70 % menos tiempo, +15 % ventas).
9. **Banner programa de partners** ("¿Querés ser parte de nuestra red de canales?").
10. **"Nuestros números"**: contadores animados (POS activos, tiendas, marcas, años,
    países, colaboradores).
11. **Formulario calificador**: nombre, email corporativo, teléfono, cantidad de tiendas,
    PDV por tienda, ¿tiene ecommerce?, transacciones mensuales, mensaje.
12. **Newsletter** + **footer** con oficinas por país y redes.

## Qué hacen bien (aprender)

- **Suite con nombres de producto** → percepción de plataforma, no de "un sistema".
- **Navegación por solución** (qué problema resuelvo), no por módulo técnico.
- **Prueba social pesada**: logos de clientes + casos con números concretos.
- **Segmentos verticales** con lenguaje del rubro y fotos de personas operando.
- **CTA repetido** en 3 lugares (hero, banda media, formulario final).
- **Formulario que califica el lead** (tamaño del negocio) antes de que hable ventas.
- **Presencia regional** (oficinas) como señal de solidez.

## Qué hacen mal (no copiar)

- Hero de ~2 pantallas de video sin contenido: el primer texto aparece muy abajo.
- Banner de cookies tapando el hero.
- Las 5 tarjetas de producto usan **la misma imagen placeholder**.
- Contadores que muestran "+0k" si el JS no corre (rotos en carga).
- Tipografías mezcladas (títulos en Arial/Helvetica junto a la fuente de marca).
- Botones pill genéricos, colores planos sin jerarquía; se ve "template corporativo".
- Sin testimonios con nombre ni certificaciones.

## Cómo lo trasladamos a Ninja Soft

| Napse | Ninja Soft (aplicar) | Estado |
|---|---|---|
| Suite con nombres | NinjaPOS · Ninja Food · Servicios (+ módulos con nombre propio si suma) | a definir |
| Dropdown "Soluciones" | Menú con submenú por producto y por rubro | pendiente |
| Muro de logos de clientes | **Sólo con clientes reales y autorización.** No inventar | falta data |
| Casos con números | Casos reales de implementaciones (ERP/POS/ecommerce) | falta data |
| Segmentos con fotos | Rubros (kiosco, tienda, gastronomía, profesionales) con foto/escena real | pendiente |
| Banda CTA media | Agregar banda WhatsApp entre secciones | pendiente |
| Contadores | Números reales (años de experiencia, implementaciones, integraciones) renderizados en HTML, sin depender de JS | falta data |
| Form calificador | WhatsApp con mensaje prearmado según rubro/tamaño (sin backend) | pendiente |
| Hero video | Video del isotipo (Gemini) **sin** empujar el contenido abajo | en curso |

Ventaja diferencial frente a Napse que la home tiene que gritar: **todos los medios de pago
del país + precio pyme + puesta en marcha en minutos**, cosas que una suite enterprise no ofrece.
