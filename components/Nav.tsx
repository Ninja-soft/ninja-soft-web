"use client";

import { useEffect, useRef, useState } from "react";
import { ChatCircleDots } from "@phosphor-icons/react";
import { openChat } from "@/lib/chat-events";
import { NAV_LINKS, POS_APP_URL, PRODUCTS, SERVICES } from "@/lib/content";

// Única capa de vidrio del sitio: la barra flota sobre el contenido.
// Desktop: desplegable "Productos" (mega menú con los logos). Mobile: hoja a pantalla completa.
export function Nav() {
  const [open, setOpen] = useState<null | "products" | "mobile">(null);
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.location.hash) {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!barRef.current?.contains(t) && !sheetRef.current?.contains(t)) setOpen(null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open === "mobile" ? "hidden" : "";
  }, [open]);

  const close = () => setOpen(null);
  const productsOpen = open === "products";

  return (
    <>
    <header
      ref={barRef}
      className={`sticky top-0 z-30 transition-[background-color,box-shadow] duration-200 ${
        scrolled || open ? "bg-paper/80 shadow-[0_1px_0_rgba(17,12,34,.06),0_8px_30px_rgba(17,12,34,.06)]" : "bg-paper/60"
      } backdrop-blur-xl backdrop-saturate-150`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <a href="#top" onClick={close} className="group mr-4 flex min-h-[44px] shrink-0 items-center gap-2">
          <img
            src="/images/brand/ninja-isotipo-flame.webp"
            alt=""
            width={240}
            height={311}
            className="h-8 w-auto transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
          />
          <img src="/images/brand/ninjasoft-logo-light.webp" alt="Ninja Soft" width={640} height={145} className="h-6 w-auto" />
        </a>

        <nav aria-label="Principal" className="hidden items-center lg:flex">
          <button
            type="button"
            aria-expanded={productsOpen}
            aria-controls="menu-productos"
            onClick={() => setOpen(productsOpen ? null : "products")}
            onMouseEnter={() => setOpen("products")}
            className={`group flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition ${
              productsOpen ? "bg-ink/[.06] text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            Productos
            <svg aria-hidden viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`}>
              <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onMouseEnter={close}
              className="flex min-h-[44px] items-center rounded-full px-3.5 text-[14px] font-medium text-ink-2 transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <a
            href={POS_APP_URL}
            className="flex min-h-[40px] items-center rounded-full px-4 text-[14px] font-semibold text-ink transition hover:bg-ink/[.06]"
          >
            Probar gratis
          </a>
          <button
            type="button"
            onClick={openChat}
            aria-label="Abrir el chat"
            title="Chateá con nosotros"
            className="nav-chat-btn relative grid h-10 w-10 place-items-center rounded-full"
          >
            <ChatCircleDots size={22} weight="fill" className="nav-chat-icon" />
            <span aria-hidden className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#30d158] ring-2 ring-paper" />
          </button>
        </div>

        <button
          type="button"
          aria-label={open === "mobile" ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open === "mobile"}
          onClick={() => setOpen(open === "mobile" ? null : "mobile")}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-ink/[.06] sm:ml-2 lg:hidden"
        >
          <span className="relative block h-3 w-[18px]">
            <span className={`absolute left-0 h-[1.5px] w-full rounded bg-current transition-all duration-200 ${open === "mobile" ? "top-1/2 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 h-[1.5px] w-full rounded bg-current transition-all duration-200 ${open === "mobile" ? "top-1/2 -rotate-45" : "bottom-0"}`} />
          </span>
        </button>
      </div>

      {/* Mega menú de productos (desktop) */}
      <div
        id="menu-productos"
        onMouseLeave={close}
        className={`absolute inset-x-0 top-full hidden border-t border-ink/5 bg-paper/95 backdrop-blur-xl transition-[opacity,transform] duration-200 lg:block ${
          productsOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_1fr_.8fr] gap-4 px-4 pb-8 pt-6">
          {PRODUCTS.map((p) => (
            <div key={p.key} className="group rounded-[22px] border border-line bg-white p-6 transition hover:shadow-[0_20px_50px_rgba(33,19,90,.08)]">
              <a href={p.href} onClick={close} className="block">
                <img src={p.logo} alt={p.name} width={p.logoSize[0]} height={p.logoSize[1]} className="h-8 w-auto" />
                <p className="mt-3 text-[15px] leading-snug text-ink-2">{p.tagline}</p>
              </a>
              <ul className="mt-5 grid gap-1.5">
                {p.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} onClick={close} className="text-[14px] font-medium text-ink hover:underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a href={p.cta.href} onClick={close} className={`mt-5 inline-flex text-[14px] font-semibold ${p.accent} hover:underline`}>
                {p.cta.label}&nbsp;›
              </a>
            </div>
          ))}
          <div className="rounded-[22px] bg-night p-6 text-snow">
            <p className="font-display text-xl font-bold">Servicios a medida</p>
            <p className="mt-2 text-[14px] leading-snug text-mist">Integraciones, ecommerce y desarrollo para tu operación.</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {SERVICES.map((s) => (
                <li key={s} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px]">
                  {s}
                </li>
              ))}
            </ul>
            <a href="#servicios" onClick={close} className="mt-5 inline-flex text-[14px] font-semibold text-flame-linkDark hover:underline">
              Ver servicios&nbsp;›
            </a>
          </div>
        </div>
      </div>
    </header>

      {/* Hoja mobile: fuera del header porque backdrop-filter rompe position:fixed */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto bg-paper px-4 pb-10 pt-4 transition-opacity duration-200 lg:hidden ${
          open === "mobile" ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink-2">Productos</p>
        <div className="mt-3 grid gap-3">
          {PRODUCTS.map((p) => (
            <a key={p.key} href={p.href} onClick={close} className="rounded-[20px] border border-line bg-white p-5">
              <img src={p.logo} alt={p.name} width={p.logoSize[0]} height={p.logoSize[1]} className="h-7 w-auto" />
              <p className="mt-2 text-[14px] leading-snug text-ink-2">{p.tagline}</p>
            </a>
          ))}
        </div>
        <nav aria-label="Secciones" className="mt-6 grid">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close} className="flex min-h-[52px] items-center border-b border-line font-display text-2xl font-bold">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => {
              close();
              openChat();
            }}
            className="btn-flame justify-center"
          >
            Abrir el chat
          </button>
          <a href={POS_APP_URL} className="flex min-h-[44px] items-center justify-center rounded-full border border-line text-[15px] font-semibold">
            Probar NinjaPOS gratis
          </a>
        </div>
      </div>
    </>
  );
}
