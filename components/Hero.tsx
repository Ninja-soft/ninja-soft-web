import { HeroArt } from "./HeroArt";

export function Hero() {
  return (
    <section className="overflow-hidden px-4 pt-[72px] text-center">
      <p className="text-[15px] font-semibold text-flame-link">Software argentino</p>
      <h1 className="mt-3.5 text-[clamp(44px,8vw,88px)] font-black leading-[1.02] tracking-[-0.04em]">
        Software seguro para negocios <span className="text-flame">inteligentes.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-[34ch] text-[clamp(19px,2.2vw,24px)] leading-[1.35] text-ink-2">
        Punto de venta, trazabilidad alimentaria y desarrollo a medida. Hecho por quienes implementaron los sistemas
        que usa la industria.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-7">
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
