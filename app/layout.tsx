import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Quicksand, Unbounded } from "next/font/google";
import "./globals.css";

// Quicksand es la tipografía del wordmark "Ninja" (Bold) y "Soft" (Regular) del logo.
const display = Quicksand({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
// Unbounded: tipografía ancha y pesada para palabras-hero (estilo "PRO" de apple.com).
const wide = Unbounded({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-wide" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://soft.ninja"),
  title: "Ninja Soft · Software seguro para negocios inteligentes",
  description:
    "NinjaPOS, Ninja Food y desarrollo a medida. Punto de venta con todos los medios de pago del país, trazabilidad alimentaria e integraciones con Mercado Libre y Mercado Pago.",
  openGraph: {
    title: "Ninja Soft",
    description: "Software seguro para negocios inteligentes.",
    url: "https://soft.ninja",
    siteName: "Ninja Soft",
    locale: "es_AR",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#FAF9FD", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable} ${mono.variable} ${wide.variable}`}>
      <body>{children}</body>
    </html>
  );
}
