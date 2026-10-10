import { HeroArt } from "./HeroArt";
import { HeroPillars } from "./HeroPillars";
import { TechBackground } from "./TechBackground";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-[72px] text-center">
      <div aria-hidden className="hero-atmos pointer-events-none absolute inset-0 -z-10" />
      <TechBackground />
      <h1 className="mt-4 text-[clamp(44px,8vw,88px)] font-bold leading-[1.02] tracking-[-0.035em]">
        Software seguro para negocios <span className="text-alive">inteligentes.</span>
      </h1>

      <HeroPillars />

      <div className="mt-9 flex flex-wrap items-center justify-center gap-7">
        <a href="#pos" className="btn-flame">
          Ver productos
        </a>
        <a href="#hablemos" className="link-more">
          Hablar con el equipo
        </a>
      </div>
      <HeroArt />
    </section>
  );
}
