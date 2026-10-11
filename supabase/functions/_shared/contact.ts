import type { Mailer } from "./resend.ts";
import { isTopicGone, type TelegramApi } from "./telegram.ts";
import { brandVars, formatDate, renderTemplate, type TemplateData } from "./template.ts";
import type { HandlerResult, Store, TemplateKey } from "./types.ts";
import { emailList, isHoneypotFilled, obj, validateContact } from "./validate.ts";

export const CONTACT_LIMIT = { perIp: 5, windowMs: 3_600_000 };
export const FORMS_TOPIC = "📥 Formularios";
// Tope global de auto-respuestas: evita usar el formulario para mandar mails a terceros desde nuestro dominio.
export const ACK_GLOBAL_PER_HOUR = 30;

export type ContactDeps = {
  store: Store;
  mailer: (apiKey: string) => Mailer;
  telegram: (token: string, groupId: string) => TelegramApi;
};

export async function handleContact(
  deps: ContactDeps,
  input: { ip: string; body: unknown },
  now = Date.now(),
): Promise<HandlerResult> {
  const { store } = deps;
  const o = obj(input.body);
  if (isHoneypotFilled(o)) return { status: 200, json: { ok: true } };
  const v = validateContact(o);
  if (!v.ok) return { status: 400, json: { error: v.error } };

  const bucket = `contact:ip:${input.ip}`;
  if ((await store.countRecent(bucket, CONTACT_LIMIT.windowMs)) >= CONTACT_LIMIT.perIp) {
    return { status: 429, json: { error: "Recibimos varias consultas seguidas. Probá más tarde." } };
  }
  await store.hit(bucket);
  await store.saveContact({ ...v.value, ip_hash: input.ip });

  const s = await store.settings();
  const c = v.value;
  const data: TemplateData = {
    ...brandVars(s),
    nombre: c.name,
    email: c.email,
    telefono: c.phone,
    empresa: c.company,
    rubro: c.business,
    mensaje: c.message,
    fecha: formatDate(now),
    link_sitio: s.site_url,
    reunion: c.meeting ? ["Sí, por Microsoft Teams", c.meeting_pref].filter(Boolean).join(" · ") : "No",
  };

  // Emails: cada uno por separado, para que una falla no frene al otro.
  const key = await store.secret("resend_api_key");
  if (key && s.sender) {
    const mail = deps.mailer(key);
    const send = async (tplKey: TemplateKey, to: string, replyTo: string | undefined) => {
      const tpl = await store.template(tplKey);
      if (!tpl || !to) return;
      try {
        await mail({
          from: s.sender,
          to,
          subject: renderTemplate(tpl.subject, data, { html: false }),
          html: renderTemplate(tpl.html, data),
          replyTo,
        });
      } catch (err) {
        console.error(`contact-submit: ${tplKey}`, err);
      }
    };
    const team = emailList(s.notify_email);
    for (const to of team) await send("contact_notify", to, c.email);
    if ((await store.countRecent("contact:ack:global", 3_600_000)) < ACK_GLOBAL_PER_HOUR) {
      await store.hit("contact:ack:global");
      await send("contact_ack", c.email, team[0]);
    }
  }

  // Aviso en Telegram, en el tema "Formularios".
  try {
    const token = await store.secret("telegram_bot_token");
    if (token && s.telegram_group_id) {
      const tg = deps.telegram(token, s.telegram_group_id);
      const newTopic = async () => {
        const id = await tg.createTopic(FORMS_TOPIC);
        await store.setSetting("forms_thread_id", String(id));
        return id;
      };
      const thread = Number(s.forms_thread_id) || (await newTopic());
      const lines = ["📥 Nuevo contacto", `Nombre: ${c.name}`, `Email: ${c.email}`];
      if (c.company) lines.push(`Empresa: ${c.company}`);
      if (c.phone) lines.push(`Teléfono: ${c.phone}`);
      if (c.business) lines.push(`Rubro: ${c.business}`);
      if (c.meeting) lines.push(`📅 Quiere una reunión por Teams${c.meeting_pref ? ` (${c.meeting_pref})` : ""}`);
      lines.push("", c.message);
      const text = lines.join("\n").slice(0, 4000);
      try {
        await tg.send(thread, text);
      } catch (err) {
        if (!isTopicGone(err)) throw err;
        await tg.send(await newTopic(), text);
      }
    }
  } catch (err) {
    console.error("contact-submit: telegram", err);
  }

  return { status: 200, json: { ok: true } };
}
