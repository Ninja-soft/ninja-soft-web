import type { Mailer } from "./resend.ts";
import { parseAgentUpdate, type TelegramApi } from "./telegram.ts";
import { brandVars, formatDate, renderTemplate } from "./template.ts";
import type { Media, Store } from "./types.ts";
import { emailList, isEmail } from "./validate.ts";

export type WebhookDeps = {
  store: Store;
  mailer: (apiKey: string) => Mailer;
  telegram: (token: string, groupId: string) => TelegramApi;
  media: Media;
};

export async function handleTelegramUpdate(
  deps: WebhookDeps,
  update: unknown,
  now = Date.now(),
): Promise<{ handled: boolean; emailed: boolean }> {
  const { store } = deps;
  const s = await store.settings();
  const reply = parseAgentUpdate(update, s.telegram_group_id ?? "");
  if (!reply) return { handled: false, emailed: false };
  const session = await store.sessionByThread(reply.threadId);
  if (!session) return { handled: false, emailed: false };

  // Foto desde Telegram: se copia al storage para que el visitante la vea.
  let mediaPath: string | null = null;
  if (reply.photoFileId) {
    const token = await store.secret("telegram_bot_token");
    if (!token) return { handled: false, emailed: false };
    const file = await deps.telegram(token, s.telegram_group_id ?? "").downloadFile(reply.photoFileId);
    mediaPath = `${session.id}/tg-${reply.messageId}.jpg`;
    await deps.media.upload(mediaPath, file.bytes, file.contentType.startsWith("image/") ? file.contentType : "image/jpeg");
  }

  const saved = await store.addMessage({
    session_id: session.id,
    sender: "agent",
    body: reply.text,
    telegram_message_id: reply.messageId,
    media_path: mediaPath,
  });

  // Si el visitante no está en la página, la respuesta también le llega por email.
  const awayMs = (Number(s.away_minutes) || 2) * 60_000;
  const away = now - Date.parse(session.last_seen_at) > awayMs;
  if (!away || !isEmail(session.contact)) return { handled: true, emailed: false };
  try {
    const key = await store.secret("resend_api_key");
    const tpl = await store.template("chat_reply");
    if (!key || !tpl || !s.sender) return { handled: true, emailed: false };
    const data = {
      ...brandVars(s),
      nombre: session.name,
      email: session.contact,
      respuesta: reply.text || (mediaPath ? "📷 Te enviamos una foto. Abrí el chat para verla." : ""),
      fecha: formatDate(now),
      link_sitio: s.site_url,
    };
    await deps.mailer(key)({
      from: s.sender,
      to: session.contact,
      subject: renderTemplate(tpl.subject, data, { html: false }),
      html: renderTemplate(tpl.html, data),
      replyTo: emailList(s.notify_email)[0],
    });
    await store.markEmailed(saved.id);
    return { handled: true, emailed: true };
  } catch (err) {
    console.error("telegram-webhook: email", err);
    return { handled: true, emailed: false };
  }
}
