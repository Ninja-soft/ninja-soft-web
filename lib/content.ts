// Contenido del sitio en un solo lugar: textos de producto, medios de pago,
// rubros y funciones. Las secciones sólo leen de acá.

export const POS_APP_URL = "https://pos.soft.ninja";
export const FOOD_APP_URL = "https://food.soft.ninja";
export const INSTAGRAM_URL = "https://www.instagram.com/ninjasoft.latam/";
export const ADDRESS = { street: "Urquiza 3164", city: "Rosario, Santa Fe, Argentina" } as const;
export const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Urquiza+3164+Rosario+Santa+Fe+Argentina";

// Preguntas frecuentes: se muestran en la página y van como datos estructurados (FAQPage) para Google.
export const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué es NinjaPOS?",
    a: "NinjaPOS es un sistema de punto de venta (POS) en la nube hecho en Argentina. Desde el celular, la tablet o la computadora vendés, cobrás con todos los medios de pago, facturás electrónicamente ante ARCA y controlás el stock de todas tus sucursales.",
  },
  {
    q: "¿Sirve para kioscos, almacenes y minimercados?",
    a: "Sí. Tiene lector de códigos de barras, PLU, productos por peso con balanza, botones rápidos y cobro en segundos, para que la fila no crezca.",
  },
  {
    q: "¿Sirve para restaurantes, bares y cafeterías?",
    a: "Sí. Gestionás mesas, mandás comandas a cocina sin papelitos y recibís en una sola pantalla los pedidos de Rappi, PedidosYa, Uber Eats y tu delivery propio.",
  },
  {
    q: "¿Hace factura electrónica con ARCA (ex AFIP)?",
    a: "Sí. Emitís Factura A, B y C electrónica ante ARCA en un clic, sin salir de la venta, y el comprobante le llega al cliente por email.",
  },
  {
    q: "¿Qué medios de pago acepta?",
    a: "Mercado Pago (QR y Point), MODO, Payway, Getnet, Nave, Fiserv, Mobbex, Pagos360, Directo (crédito directo) y GO Cuotas (cuotas sin tarjeta), con Visa, Mastercard, American Express, Naranja X, Cabal, Apple Pay y Google Pay. También efectivo, transferencia, QR interoperable y links de pago.",
  },
  {
    q: "¿Se integra con Mercado Libre y con mi tienda online?",
    a: "Sí. Publicás, sincronizás el stock y gestionás las ventas de Mercado Libre y tu tienda online desde el mismo sistema, sin vender lo que no tenés.",
  },
  {
    q: "¿Necesito instalar algo o comprar una computadora especial?",
    a: "No. NinjaPOS funciona en el navegador de cualquier celular, tablet o computadora. Tus datos quedan seguros en la nube y podés usarlo desde donde estés.",
  },
  {
    q: "¿Puedo probarlo gratis?",
    a: "Sí. Creá tu cuenta en pos.soft.ninja y empezá a vender hoy. Si querés, te ayudamos a cargar tu catálogo desde Excel.",
  },
  {
    q: "¿Qué es Ninja Food?",
    a: "Ninja Food es el sistema de trazabilidad y gestión bromatológica para la industria alimenticia: lotes, vencimientos, cadena de frío y firmas, con respaldo técnico de ABR.",
  },
  {
    q: "¿Hacen desarrollos e integraciones a medida?",
    a: "Sí. Integramos tu ecommerce, ERP, WMS y cobros, y desarrollamos lo que tu negocio necesite. Venimos de implementar los sistemas que usan las grandes cadenas del país.",
  },
];

export const NAV = [
  { href: "#pos", label: "NinjaPOS" },
  { href: "#food", label: "Ninja Food" },
  { href: "#servicios", label: "Servicios" },
  { href: "#nosotros", label: "Nosotros" },
] as const;

// Menú superior: secciones planas + el desplegable de productos.
export const NAV_LINKS = [
  { href: "#rubros", label: "Rubros" },
  { href: "#medios", label: "Medios de pago" },
  { href: "#servicios", label: "Servicios" },
  { href: "#experiencia", label: "Nosotros" },
] as const;

export const PRODUCTS = [
  {
    key: "pos",
    logo: "/images/brand/ninjapos-logo-light.webp",
    logoSize: [640, 154],
    name: "NinjaPOS",
    tagline: "Punto de venta para kioscos, tiendas, gastronomía y profesionales.",
    href: "#pos",
    accent: "text-flame-link",
    links: [
      { href: "#medios", label: "Medios de pago" },
      { href: "#rubros", label: "Para cada rubro" },
      { href: "#funciones", label: "Funciones" },
    ],
    cta: { href: POS_APP_URL, label: "Probar gratis" },
  },
  {
    key: "food",
    logo: "/images/brand/ninjafood-logo-light.webp",
    logoSize: [640, 142],
    name: "Ninja Food",
    tagline: "Trazabilidad y gestión bromatológica para la industria alimenticia.",
    href: "#food",
    accent: "text-food",
    links: [
      { href: "#food", label: "Cómo funciona" },
      { href: "#hablemos", label: "Pedir una demo" },
    ],
    cta: { href: FOOD_APP_URL, label: "Ingresar" },
  },
] as const;

export const PROCESSORS = [
  { src: "/images/payments/processors/mercadopago.webp", alt: "Mercado Pago" },
  { src: "/images/payments/processors/modo.webp", alt: "MODO" },
  { src: "/images/payments/processors/payway.webp", alt: "Payway" },
  { src: "/images/payments/processors/getnet.webp", alt: "Getnet" },
  { src: "/images/payments/processors/nave.webp", alt: "Nave" },
  { src: "/images/payments/processors/fiserv.webp", alt: "Fiserv" },
  { src: "/images/payments/processors/mobbex.webp", alt: "Mobbex" },
  { src: "/images/payments/processors/pagos360.webp", alt: "Pagos360" },
  { src: "/images/payments/processors/directo.webp", alt: "Directo" },
  { src: "/images/payments/processors/gocuotas.webp", alt: "GO Cuotas" },
] as const;

export const NETWORKS = [
  { src: "/images/payments/networks/visa.webp?v=2", alt: "Visa" },
  { src: "/images/payments/networks/mastercard.webp?v=2", alt: "Mastercard" },
  { src: "/images/payments/networks/maestro.webp?v=2", alt: "Maestro" },
  { src: "/images/payments/networks/amex.webp?v=3", alt: "Amex" },
  { src: "/images/payments/networks/naranjax.webp?v=2", alt: "Naranja X" },
  { src: "/images/payments/networks/cabal.webp?v=2", alt: "Cabal" },
  { src: "/images/payments/networks/diners.webp?v=2", alt: "Diners Club" },
  { src: "/images/payments/networks/applepay.webp?v=2", alt: "Apple Pay" },
  { src: "/images/payments/networks/googlepay.webp?v=2", alt: "Google Pay" },
  { src: "/images/payments/networks/pagofacil.webp?v=2", alt: "Pago Fácil" },
  { src: "/images/payments/networks/rapipago.webp?v=2", alt: "Rapipago" },
] as const;

// Decisión comercial (Lucas, 2026-10-10): las funciones del roadmap se
// presentan junto a las existentes. `roadmap: true` marca las que todavía no
// están en producción (facturacion_afip, promociones, api_publica son
// MARKETING-FUTURO en el POS; contabilidad aún no existe como feature).
export const FEATURES: { title: string; desc: string; roadmap?: boolean }[] = [
  { title: "Facturación electrónica ARCA", desc: "Factura A, B y C emitida desde el POS.", roadmap: true },
  { title: "Contabilidad", desc: "Libros de IVA y asientos a partir de tus ventas.", roadmap: true },
  { title: "Caja y arqueo", desc: "Apertura, cierre de turno y movimientos." },
  { title: "Stock e inventario", desc: "Ajustes, movimientos y alertas." },
  { title: "Clientes y grupos", desc: "Ficha, historial y segmentos." },
  { title: "Cuenta corriente", desc: "Ventas a crédito, saldos y pagos a cuenta." },
  { title: "Devoluciones", desc: "Notas de crédito y vales para el cliente." },
  { title: "Garantías", desc: "Cobertura y plazos por producto vendido." },
  { title: "Promociones y combos", desc: "2x1, packs y precios por campaña.", roadmap: true },
  { title: "Tickets con tu marca", desc: "Diseñador de tickets con logo y QR." },
  { title: "Comprobantes por email", desc: "El ticket llega al correo del cliente." },
  { title: "Reportes y Excel", desc: "Ventas por período, producto y medio de pago." },
  { title: "Multisucursal", desc: "Stock y ventas por local, consolidados." },
  { title: "Panel del dueño", desc: "Indicadores y control del negocio." },
  { title: "Auditoría", desc: "Quién hizo qué y cuándo." },
  { title: "Pantalla para el cliente", desc: "El cliente ve su compra mientras pagás." },
  { title: "Asistente con IA", desc: "Consultas sobre tu negocio en lenguaje natural." },
  { title: "API pública", desc: "Conectá NinjaPOS con tu software.", roadmap: true },
];

export const SERVICES = [
  "Mercado Libre",
  "Mercado Pago",
  "Ecommerce",
  "ERP y WMS",
  "APIs",
] as const;

export const PROCESS = [
  { title: "Detectamos", desc: "Entendemos cómo opera tu negocio hoy y dónde pierde tiempo o plata." },
  { title: "Diseñamos", desc: "Proponemos la solución: producto armado, integración o desarrollo propio." },
  { title: "Implementamos", desc: "Configuramos, migramos datos y capacitamos al equipo." },
  { title: "Acompañamos", desc: "Soporte de gente que conoce tu sistema por dentro." },
] as const;
