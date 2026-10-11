// Contenido del sitio en un solo lugar: textos de producto, medios de pago,
// rubros y funciones. Las secciones sólo leen de acá.

// TODO(lucas): reemplazar por el número real (formato internacional sin "+").
export const WHATSAPP_NUMBER = "5490000000000";
export const whatsappUrl = (text = "Hola Ninja Soft, quiero hacer una consulta.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const POS_APP_URL = "https://pos.soft.ninja";
export const FOOD_APP_URL = "https://food.soft.ninja";

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
  { href: "#nosotros", label: "Nosotros" },
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
] as const;

export const NETWORKS = [
  { src: "/images/payments/networks/visa.webp", alt: "Visa" },
  { src: "/images/payments/networks/mastercard.webp", alt: "Mastercard" },
  { src: "/images/payments/networks/amex.webp", alt: "American Express" },
  { src: "/images/payments/networks/cabal.webp", alt: "Cabal" },
  { src: "/images/payments/networks/naranjax.webp", alt: "Naranja X" },
  { src: "/images/payments/networks/maestro.webp", alt: "Maestro" },
  { src: "/images/payments/networks/diners.webp", alt: "Diners Club" },
  { src: "/images/payments/networks/pagofacil.webp", alt: "Pago Fácil" },
  { src: "/images/payments/networks/rapipago.webp", alt: "Rapipago" },
] as const;

export const SEGMENTS = [
  {
    title: "Kioscos y almacenes",
    items: [
      "Venta con lector de códigos y PLU",
      "Stock que se descuenta en cada venta",
      "Etiquetas de precios",
      "Cuenta corriente para clientes de confianza",
    ],
  },
  {
    title: "Tiendas y catálogo",
    items: [
      "Variantes por talle y color",
      "Tienda online con tu catálogo",
      "Listas de precios mayorista y minorista",
      "Importación desde Excel",
    ],
  },
  {
    title: "Gastronomía",
    items: [
      "Salón y mesas",
      "Comandas a cocina con pantalla KDS",
      "Delivery propio y reservas",
      "Modificadores y adicionales",
    ],
  },
  {
    title: "Profesionales y servicios",
    items: [
      "Agenda y turnos por profesional",
      "Packs de sesiones prepagas",
      "Cobro del turno desde la agenda",
      "Ficha e historial del cliente",
    ],
  },
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
