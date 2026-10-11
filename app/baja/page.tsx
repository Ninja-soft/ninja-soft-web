"use client";

import { useEffect, useState } from "react";
import { CheckCircle, EnvelopeSimpleOpen, WarningCircle } from "@phosphor-icons/react";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Baja de las novedades por email. El link del email trae un token y la persona confirma con un botón
// (los antivirus que abren links solos no dan de baja a nadie).
type State = "loading" | "confirm" | "sending" | "ok" | "error";

export default function BajaPage() {
  const [state, setState] = useState<State>("loading");
  const [token, setToken] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("t") ?? "";
    setToken(t);
    setState(q.get("ok") === "1" ? "ok" : t ? "confirm" : "error");
  }, []);

  async function confirm() {
    setState("sending");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/unsubscribe?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY },
      });
      setState(r.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f4f9] px-4 text-center">
      <div className="max-w-md rounded-[28px] bg-white p-10 shadow-[0_1px_2px_rgba(0,0,0,.04),0_20px_50px_rgba(0,0,0,.06)]">
        <img src="/images/brand/ninjasoft-logo-light.webp" alt="Ninja Soft" width={640} height={145} className="mx-auto mb-8 h-9 w-auto" />
        {state === "loading" || state === "sending" ? (
          <span role="status" aria-label="Cargando" className="mx-auto block h-8 w-8 animate-spin rounded-full border-[3px] border-[#ff4b22]/20 border-t-[#ff4b22]" />
        ) : state === "confirm" ? (
          <>
            <EnvelopeSimpleOpen size={52} weight="duotone" className="mx-auto text-[#ff4b22]" />
            <h1 className="mt-4 text-[24px] font-bold">¿Querés dejar de recibir novedades?</h1>
            <p className="mt-2 text-[15px] text-ink-2">No te vamos a mandar más emails de campañas. Si nos escribís por el chat o el formulario, te seguimos respondiendo.</p>
            <button type="button" onClick={confirm} className="btn-flame mt-7 w-full justify-center">
              Sí, darme de baja
            </button>
          </>
        ) : state === "ok" ? (
          <>
            <CheckCircle size={52} weight="fill" className="mx-auto text-[#30d158]" />
            <h1 className="mt-4 text-[24px] font-bold">Listo, te diste de baja</h1>
            <p className="mt-2 text-[15px] text-ink-2">No vas a recibir más novedades por email.</p>
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
