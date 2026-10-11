"use client";

import { useEffect, useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

// Destino del link "Darme de baja" de las campañas (la Edge Function ya hizo la baja).
export default function BajaPage() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(new URLSearchParams(window.location.search).get("ok") === "1"), []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f4f9] px-4 text-center">
      <div className="max-w-md rounded-[28px] bg-white p-10 shadow-[0_1px_2px_rgba(0,0,0,.04),0_20px_50px_rgba(0,0,0,.06)]">
        <img src="/images/brand/ninjasoft-logo-light.webp" alt="Ninja Soft" width={640} height={145} className="mx-auto mb-8 h-9 w-auto" />
        {ok === null ? (
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-[3px] border-[#ff4b22]/20 border-t-[#ff4b22]" />
        ) : ok ? (
          <>
            <CheckCircle size={52} weight="fill" className="mx-auto text-[#30d158]" />
            <h1 className="mt-4 text-[24px] font-bold">Listo, te diste de baja</h1>
            <p className="mt-2 text-[15px] text-ink-2">No vas a recibir más novedades por email. Si nos escribís por el chat o el formulario, te seguimos respondiendo.</p>
          </>
        ) : (
          <>
            <WarningCircle size={52} weight="fill" className="mx-auto text-[#ff9f0a]" />
            <h1 className="mt-4 text-[24px] font-bold">El link no es válido</h1>
            <p className="mt-2 text-[15px] text-ink-2">Puede que esté incompleto. Probá de nuevo desde el email o escribinos y te damos de baja.</p>
          </>
        )}
        <a href="/" className="link-more mt-8 inline-flex">
          Ir a soft.ninja
        </a>
      </div>
    </main>
  );
}
