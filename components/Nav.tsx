import { NAV } from "@/lib/content";

// Única capa de vidrio del sitio: la barra flota sobre el contenido.
export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/5 bg-paper/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-7 px-4">
        <a href="#top" className="flex min-h-[44px] items-center">
          <img src="/brand/ninjasoft-light.webp" alt="Ninja Soft" width={640} height={178} className="h-[22px] w-auto" />
        </a>
        <nav aria-label="Secciones" className="ml-auto hidden gap-6 text-[13px] text-ink-2 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#hablemos"
          className="ml-auto whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-paper md:ml-0"
        >
          Hablemos
        </a>
      </div>
    </header>
  );
}
