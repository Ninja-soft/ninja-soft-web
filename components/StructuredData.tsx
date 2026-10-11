import { ADDRESS, FAQ, INSTAGRAM_URL, POS_APP_URL } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// Datos estructurados (schema.org) para Google: empresa, sitio, productos y preguntas frecuentes.
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Ninja Soft",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        image: `${SITE_URL}/og.jpg`,
        sameAs: [INSTAGRAM_URL],
        address: { "@type": "PostalAddress", streetAddress: ADDRESS.street, addressLocality: "Rosario", addressRegion: "Santa Fe", addressCountry: "AR" },
        areaServed: { "@type": "Country", name: "Argentina" },
      },
      { "@type": "WebSite", "@id": `${SITE_URL}/#web`, url: SITE_URL, name: "Ninja Soft", inLanguage: "es-AR", publisher: { "@id": `${SITE_URL}/#org` } },
      {
        "@type": "SoftwareApplication",
        name: "NinjaPOS",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Sistema de punto de venta (POS)",
        operatingSystem: "Web, Android, iOS, Windows, macOS",
        url: POS_APP_URL,
        inLanguage: "es-AR",
        description:
          "Sistema de punto de venta en la nube para kioscos, almacenes, gastronomía, tiendas y profesionales: cobros con todos los medios de pago, factura electrónica ARCA, stock multisucursal e integración con Mercado Libre.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "ARS", description: "Prueba gratis" },
        publisher: { "@id": `${SITE_URL}/#org` },
        featureList: [
          "Factura electrónica ARCA (ex AFIP)",
          "Mercado Pago QR y Point, MODO, Payway, Getnet",
          "Stock multisucursal y multidepósito",
          "Mesas, comandas y delivery",
          "Integración con Mercado Libre",
          "Asistente con IA",
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: "Ninja Food",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Trazabilidad alimentaria y gestión bromatológica",
        operatingSystem: "Web",
        inLanguage: "es-AR",
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
