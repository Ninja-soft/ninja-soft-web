"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

let viewSent = false;

// Visita, secciones vistas, profundidad de scroll y clics en llamados a la acción.
export function Analytics() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const utm = { source: q.get("utm_source") ?? "", medium: q.get("utm_medium") ?? "", campaign: q.get("utm_campaign") ?? "" };
    if (!viewSent) {
      viewSent = true; // una sola visita por carga de página
      track("view", { referrer: document.referrer, utm });
    }

    // secciones: una vez cada una
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (e.isIntersecting && id && !seen.has(id)) {
            seen.add(id);
            track("section", { section: id });
          }
        }
      },
      { threshold: 0.4 },
    );
    document.querySelectorAll("main [id]").forEach((el) => io.observe(el));

    // profundidad de scroll: 25 / 50 / 75 / 100
    const marks = new Set<number>();
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 100;
        for (const m of [25, 50, 75, 100]) {
          if (pct >= m - 1 && !marks.has(m)) {
            marks.add(m);
            track("scroll", { value: m });
          }
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // llamados a la acción: links a los productos y elementos con data-cta
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest<HTMLElement>("a,[data-cta]");
      if (!el) return;
      const label = el.dataset.cta;
      const href = el instanceof HTMLAnchorElement ? el.href : "";
      if (label) track("cta", { section: label });
      else if (href.includes("pos.soft.ninja")) track("cta", { section: "probar-ninjapos" });
      else if (href.includes("food.soft.ninja")) track("cta", { section: "ingresar-ninjafood" });
      else if (href.includes("instagram.com")) track("cta", { section: "instagram" });
    };
    document.addEventListener("click", onClick);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
