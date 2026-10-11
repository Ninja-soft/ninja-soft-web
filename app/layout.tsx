import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Quicksand, Unbounded } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Quicksand es la tipografía del wordmark "Ninja" (Bold) y "Soft" (Regular) del logo.
const display = Quicksand({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
// Unbounded: tipografía ancha y pesada para palabras-hero (estilo "PRO" de apple.com).
const wide = Unbounded({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-wide" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

const TITLE = "NinjaPOS · Sistema POS y punto de venta para tu negocio en Argentina | Ninja Soft";
const DESCRIPTION =
  "Sistema de punto de venta (POS) en la nube para kioscos, almacenes, restaurantes, tiendas de ropa y profesionales. Cobrá con Mercado Pago, MODO, Payway y todas las tarjetas, facturá con ARCA (ex AFIP), controlá stock y vendé en Mercado Libre. Probalo gratis.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Ninja Soft" },
  description: DESCRIPTION,
  applicationName: "NinjaPOS",
  keywords: [
    "sistema POS",
    "punto de venta",
    "sistema de punto de venta Argentina",
    "programa para kiosco",
    "sistema para almacén",
    "sistema para restaurante",
    "sistema para bar y gastronomía",
    "sistema para tienda de ropa",
    "software de facturación electrónica",
    "factura electrónica ARCA",
    "factura electrónica AFIP",
    "Mercado Pago Point",
    "POS Mercado Pago",
    "sistema de stock",
    "sistema de gestión comercial",
    "POS en la nube",
    "integración Mercado Libre",
    "trazabilidad alimentaria",
    "Ninja Soft",
    "NinjaPOS",
  ],
  authors: [{ name: "Ninja Soft", url: SITE_URL }],
  creator: "Ninja Soft",
  publisher: "Ninja Soft",
  category: "Software",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Ninja Soft",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "NinjaPOS · El sistema POS para negocios inteligentes" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.jpg"] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#FAF9FD", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable} ${mono.variable} ${wide.variable}`}>
      <body>{children}</body>
    </html>
  );
}
