import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";

const display = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
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
    <html lang="es-AR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
