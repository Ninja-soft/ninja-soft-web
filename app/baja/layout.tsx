import type { Metadata } from "next";

export const metadata: Metadata = { title: "Baja de novedades · Ninja Soft", robots: { index: false, follow: false } };

export default function BajaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
