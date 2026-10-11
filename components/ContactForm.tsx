"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { visitorClient } from "@/lib/supabase/client";
import { functionError } from "@/lib/supabase/functionError";

const RUBROS = ["Gastronomía", "Retail / textil", "Kiosco / almacén", "Profesionales / servicios", "Industria alimenticia", "Otro"];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const { error: ferr } = await visitorClient().functions.invoke("contact-submit", { body });
    if (ferr) {
      setError(await functionError(ferr, "No pudimos enviar tu consulta. Probá de nuevo."));
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="mx-auto mt-10 max-w-[560px] rounded-[24px] bg-white/[.06] p-8 text-center ring-1 ring-inset ring-white/10">
        <CheckCircle size={40} weight="fill" className="mx-auto text-[#30d158]" />
        <p className="mt-3 text-[20px] font-bold">¡Recibimos tu consulta!</p>
        <p className="mt-1 text-mist">Te contactamos a la brevedad. Revisá tu email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 grid max-w-[560px] gap-3 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Nombre" aria-label="Nombre" className="contact-input" />
        <input name="email" type="email" required maxLength={120} autoComplete="email" placeholder="Email" aria-label="Email" className="contact-input" />
        <input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="Teléfono (opcional)" aria-label="Teléfono" className="contact-input" />
        <select name="business" defaultValue="" aria-label="Rubro" className="contact-input">
          <option value="" disabled>
            Rubro
          </option>
          {RUBROS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <textarea name="message" required minLength={5} maxLength={4000} rows={4} placeholder="Contanos qué necesitás" aria-label="Mensaje" className="contact-input resize-y" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="text-[14px] text-[#ff6961]">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn-flame justify-center disabled:opacity-60">
        {state === "sending" ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
