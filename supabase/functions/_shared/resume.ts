import type { Mailer } from "./resend.ts";
import { escapeHtml } from "./template.ts";
import type { HandlerResult, Store } from "./types.ts";
import { isEmail, obj } from "./validate.ts";

// Retomar el chat en otro navegador: código de 6 dígitos por email, válido 10 minutos.
export const PIN_TTL_MS = 10 * 60_000;
export const PIN_MAX_ATTEMPTS = 5;

const randomPin = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");

async function hashPin(sessionId: string, pin: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${sessionId}:${pin}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const cleanEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

export type ResumeRequestDeps = { store: Store; mailer: (apiKey: string) => Mailer; pin?: () => string };

export async function handleResumeRequest(deps: ResumeRequestDeps, input: { ip: string; body: unknown }): Promise<HandlerResult> {
  const { store } = deps;
  const email = cleanEmail(obj(input.body).email);
  if (!isEmail(email)) return { status: 400, json: { error: "Ingresá un email válido." } };
  const eKey = `resume:email:${email}`;
  const ipKey = `resume:ip:${input.ip}`;
  if ((await store.countRecent(eKey, 3_600_000)) >= 3 || (await store.countRecent(ipKey, 3_600_000)) >= 10) {
    return { status: 429, json: { error: "Pediste varios códigos seguidos. Probá en un rato." } };
  }
  await store.hit(eKey);
  await store.hit(ipKey);

  // Misma respuesta exista o no la conversación: no revela qué emails chatearon.
  const session = await store.openSessionByContact(email);
  if (!session) return { status: 200, json: { ok: true } };

  const pin = (deps.pin ?? randomPin)();
  await store.savePin(session.id, await hashPin(session.id, pin), new Date(Date.now() + PIN_TTL_MS).toISOString());
  try {
    const s = await store.settings();
    const key = await store.secret("resend_api_key");
    if (key && s.sender) {
      await deps.mailer(key)({
        from: s.sender,
        to: email,
        subject: `${pin} es tu código para seguir el chat · Ninja Soft`,
        html: pinEmail(pin, s.logo_soft_url ?? "", session.name),
      });
    }
  } catch (err) {
    console.error("chat-resume: email", err);
  }
  return { status: 200, json: { ok: true } };
}

export async function handleResumeVerify(deps: { store: Store }, input: { userId: string; body: unknown }): Promise<HandlerResult> {
  const { store } = deps;
  const o = obj(input.body);
  const email = cleanEmail(o.email);
  const pin = typeof o.pin === "string" ? o.pin.replace(/\D/g, "") : "";
  const invalid = { status: 400, json: { error: "El código no es válido o venció. Pedí uno nuevo." } };
  const session = isEmail(email) ? await store.openSessionByContact(email) : null;
  if (!session) return invalid;
  const rec = await store.getPin(session.id);
  if (!rec || Date.parse(rec.expires_at) < Date.now() || rec.attempts >= PIN_MAX_ATTEMPTS) return invalid;
  if (pin.length !== 6 || (await hashPin(session.id, pin)) !== rec.hash) {
    await store.bumpPinAttempts(session.id);
    return { status: 400, json: { error: "Código incorrecto." } };
  }
  await store.transferSession(session.id, input.userId);
  await store.deletePin(session.id);
  return { status: 200, json: { ok: true, sessionId: session.id } };
}

function pinEmail(pin: string, logo: string, name: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f3f2f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2f8"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
<tr><td style="background:#09051C;border-radius:20px 20px 0 0;padding:28px;text-align:center"><img src="${escapeHtml(logo)}" alt="Ninja Soft" height="30" style="display:block;margin:0 auto;height:30px;border:0"></td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 32px 36px;text-align:center">
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#09051C">Hola ${escapeHtml(name)}, este es tu código</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b7280">Usalo para seguir tu conversación con Ninja Soft en este navegador.</p>
<div style="display:inline-block;padding:16px 28px;border-radius:16px;background:#f4f3f8;font-size:34px;font-weight:800;letter-spacing:10px;color:#09051C">${pin}</div>
<p style="margin:24px 0 0;font-size:12px;color:#9ca3af">Vence en 10 minutos. Si no lo pediste, ignorá este email.</p>
</td></tr></table></td></tr></table></body></html>`;
}
