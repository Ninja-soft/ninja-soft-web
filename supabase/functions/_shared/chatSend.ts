import { isTopicGone, topicName, type TelegramApi } from "./telegram.ts";
import type { HandlerResult, Media, Session, Store } from "./types.ts";
import { isHoneypotFilled, obj, validateLead, validateMessage } from "./validate.ts";

const PHOTO_PATH = /^[0-9a-z-]+\/[0-9A-Za-z-]+\.(jpg|jpeg|png|webp)$/;

export const LIMITS = { perSession: 20, sessionWindowMs: 10 * 60_000, perIp: 60, ipWindowMs: 60 * 60_000 };

export type ChatDeps = { store: Store; telegram: (token: string, groupId: string) => TelegramApi; media: Media };

export async function handleChatSend(
  deps: ChatDeps,
  input: { userId: string; ip: string; body: unknown },
): Promise<HandlerResult> {
  const { store } = deps;
  const o = obj(input.body);
  if (isHoneypotFilled(o)) return { status: 200, json: { ok: true } };

  const mediaPath = typeof o.media_path === "string" && o.media_path ? o.media_path : null;
  const onlyPhoto = !!mediaPath && (typeof o.message !== "string" || !o.message.trim());
  const msg = onlyPhoto ? { ok: true as const, value: "" } : validateMessage(o.message);
  if (!msg.ok) return { status: 400, json: { error: msg.error } };

  let session = await store.sessionForUser(input.userId);
  // Una foto sólo puede venir de una conversación ya iniciada y de su propia carpeta.
  if (mediaPath && (!session || !PHOTO_PATH.test(mediaPath) || !mediaPath.startsWith(`${session.id}/`))) {
    return { status: 400, json: { error: "No pudimos adjuntar la foto." } };
  }
  if (!session) {
    const lead = validateLead(o);
    if (!lead.ok) return { status: 400, json: { error: lead.error } };
    session = await store.createSession(input.userId, lead.value.name, lead.value.contact);
  }

  const sKey = `chat:s:${session.id}`;
  const ipKey = `chat:ip:${input.ip}`;
  if (
    (await store.countRecent(sKey, LIMITS.sessionWindowMs)) >= LIMITS.perSession ||
    (await store.countRecent(ipKey, LIMITS.ipWindowMs)) >= LIMITS.perIp
  ) {
    return { status: 429, json: { error: "Demasiados mensajes seguidos. Probá en unos minutos." } };
  }
  await store.hit(sKey);
  await store.hit(ipKey);

  const saved = await store.addMessage({ session_id: session.id, sender: "visitor", body: msg.value, media_path: mediaPath });
  const delivered = await forward(deps, session, msg.value, mediaPath);
  return { status: 200, json: { ok: true, id: saved.id, sessionId: session.id, delivered } };
}

// Reenvía a Telegram. Si el tema ya no existe (Lucas lo borró), crea uno nuevo y reintenta una vez.
async function forward(deps: ChatDeps, session: Session, text: string, mediaPath: string | null): Promise<boolean> {
  try {
    const token = await deps.store.secret("telegram_bot_token");
    const groupId = (await deps.store.settings()).telegram_group_id;
    if (!token || !groupId) return false;
    const tg = deps.telegram(token, groupId);
    const newTopic = async () => {
      const id = await tg.createTopic(topicName(session.name, session.contact));
      await deps.store.setThread(session.id, id);
      return id;
    };
    const photo = mediaPath ? await deps.media.download(mediaPath) : null;
    const filename = mediaPath ? mediaPath.split("/").pop() ?? "foto.jpg" : "";
    const deliver = (thread: number) => (photo ? tg.sendPhoto(thread, photo, filename, text) : tg.send(thread, text));
    const thread = session.telegram_thread_id ?? (await newTopic());
    try {
      await deliver(thread);
    } catch (err) {
      if (session.telegram_thread_id == null || !isTopicGone(err)) throw err;
      await deliver(await newTopic());
    }
    return true;
  } catch (err) {
    console.error("chat-send: telegram", err);
    return false;
  }
}
