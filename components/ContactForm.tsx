"use client";

import { useState } from "react";
import {
  Basket,
  CheckCircle,
  DotsThree,
  Flask,
  ForkKnife,
  MicrosoftTeamsLogo,
  PaperPlaneTilt,
  ShoppingBagOpen,
  Stethoscope,
  type Icon,
} from "@phosphor-icons/react";
import { visitorClient } from "@/lib/supabase/client";
import { functionError } from "@/lib/supabase/functionError";
import { track } from "@/lib/track";

const RUBROS: { label: string; Icon: Icon }[] = [
  { label: "Gastronomía", Icon: ForkKnife },
  { label: "Retail / textil", Icon: ShoppingBagOpen },
  { label: "Kiosco / almacén", Icon: Basket },
  { label: "Profesionales / servicios", Icon: Stethoscope },
  { label: "Industria alimenticia", Icon: Flask },
  { label: "Otro", Icon: DotsThree },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-[13px] font-medium text-mist">
      {label}
      {children}
    </label>
  );
}

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState(false);

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
    track("form_submit");
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="contact-card mx-auto mt-12 max-w-[640px] p-10 text-center">
        <CheckCircle size={48} weight="fill" className="mx-auto text-[#30d158]" />
        <p className="mt-4 text-[22px] font-bold">¡Recibimos tu consulta!</p>
        <p className="mt-1 text-mist">
          {meeting ? "Te escribimos por email para coordinar la reunión por Teams." : "Te contactamos a la brevedad. Revisá tu email."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="contact-card mx-auto mt-12 grid max-w-[640px] gap-4 p-6 text-left sm:p-8">
      <div>
        <p className="text-[20px] font-bold tracking-[-0.01em]">Dejanos tu consulta</p>
        <p className="mt-1 text-[14px] text-mist">Te respondemos por email en horario comercial.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Juan Pérez" className="contact-input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required maxLength={120} autoComplete="email" placeholder="juan@tunegocio.com" className="contact-input" />
        </Field>
        <Field label="Teléfono (opcional)">
          <input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="+54 9 341 …" className="contact-input" />
        </Field>
        <Field label="Empresa (opcional)">
          <input name="company" maxLength={80} autoComplete="organization" placeholder="Tu negocio" className="contact-input" />
        </Field>

      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-[13px] font-medium text-mist">Rubro</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RUBROS.map(({ label, Icon }) => (
            <label key={label} className="contact-chip">
              <input type="radio" name="business" value={label} className="sr-only" />
              <Icon size={20} weight="duotone" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="¿En qué te ayudamos?">
        <textarea name="message" required minLength={5} maxLength={4000} rows={4} placeholder="Contanos qué necesitás para tu negocio" className="contact-input resize-y" />
      </Field>

      {/* reunión por Microsoft Teams */}
      <label className={`contact-meeting flex cursor-pointer items-center gap-3 rounded-[16px] p-4 ${meeting ? "is-on" : ""}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#5b5fc7] text-white">
          <MicrosoftTeamsLogo size={22} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[15px] font-semibold text-white">Quiero agendar una reunión por Teams</b>
          <span className="block text-[13px] text-mist">Una videollamada de 30 minutos con el equipo.</span>
        </span>
        <input type="checkbox" name="meeting" checked={meeting} onChange={(e) => setMeeting(e.target.checked)} className="sr-only" />
        <span aria-hidden className="contact-switch" />
      </label>
      {meeting && (
        <Field label="¿Qué día y horario te queda bien? (opcional)">
          <input name="meeting_pref" maxLength={120} placeholder="Ej.: martes o jueves a la tarde" className="contact-input" />
        </Field>
      )}

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="text-[14px] text-[#ff6961]">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn-flame justify-center gap-2 disabled:opacity-60">
        <PaperPlaneTilt size={18} weight="fill" />
        {state === "sending" ? "Enviando…" : meeting ? "Enviar y pedir reunión" : "Enviar consulta"}
      </button>
    </form>
  );
}
