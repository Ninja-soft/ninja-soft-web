import { topicName, type TelegramApi } from "./telegram.ts";
import type { HandlerResult, Session, Store } from "./types.ts";
import { isHoneypotFilled, obj, validateLead, validateMessage } from "./validate.ts";

export const LIMITS = { perSession: 20, sessionWindowMs: 10 * 60_000, perIp: 60, ipWindowMs: 60 * 60_000 };

export type ChatDeps = { store: Store; telegram: (token: string, groupId: string) => TelegramApi };

export async function handleChatSend(
  deps: ChatDeps,
  input: { userId: string; ip: string; body: unknown },
): Promise<HandlerResult> {
  const { store } = deps;
  const o = obj(input.body);
  if (isHoneypotFilled(o)) return { status: 200, json: { ok: true } };

  const msg = validateMessage(o.message);
  if (!msg.ok) return { status: 400, json: { error: msg.error } };

  let session = await store.sessionForUser(input.userId);
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

  const saved = await store.addMessage({ session_id: session.id, sender: "visitor", body: msg.value });
  const delivered = await forward(deps, session, msg.value);
  return { status: 200, json: { ok: true, id: saved.id, sessionId: session.id, delivered } };
}

// Reenvía a Telegram. Si el tema ya no existe (Lucas lo borró), crea uno nuevo y reintenta una vez.
async function forward(deps: ChatDeps, session: Session, text: string): Promise<boolean> {
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
    const thread = session.telegram_thread_id ?? (await newTopic());
    try {
      await tg.send(thread, text);
    } catch (err) {
      if (session.telegram_thread_id == null) throw err;
      await tg.send(await newTopic(), text);
    }
    return true;
  } catch (err) {
    console.error("chat-send: telegram", err);
    return false;
  }
}
