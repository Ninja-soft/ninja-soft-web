import { obj } from "./validate.ts";

export const TOPIC_NAME_MAX = 128;

export function topicName(name: string, contact: string): string {
  const chars = [...`${name} · ${contact}`];
  return chars.length > TOPIC_NAME_MAX ? chars.slice(0, TOPIC_NAME_MAX - 1).join("") + "…" : chars.join("");
}

export type AgentReply = { threadId: number; text: string; messageId: number };

// Sólo cuenta como respuesta un texto de una persona, dentro de un tema del grupo configurado.
export function parseAgentUpdate(update: unknown, groupId: string): AgentReply | null {
  const m = obj(obj(update).message);
  if (!Object.keys(m).length) return null;
  if (String(obj(m.chat).id) !== groupId) return null;
  if (obj(m.from).is_bot === true) return null;
  if (m.is_topic_message !== true || typeof m.message_thread_id !== "number") return null;
  if (typeof m.text !== "string" || !m.text.trim()) return null;
  return { threadId: m.message_thread_id, text: m.text.trim(), messageId: Number(m.message_id) };
}

export type TelegramApi = {
  createTopic(name: string): Promise<number>;
  send(threadId: number | null, text: string): Promise<number>;
};

export function telegramApi(token: string, groupId: string, fetchFn: typeof fetch = fetch): TelegramApi {
  async function call(method: string, payload: Record<string, unknown>) {
    const r = await fetchFn(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = obj(await r.json());
    if (data.ok !== true) throw new Error(`Telegram ${method}: ${String(data.description ?? r.status)}`);
    return obj(data.result);
  }
  return {
    async createTopic(name) {
      return Number((await call("createForumTopic", { chat_id: groupId, name })).message_thread_id);
    },
    // Texto plano a propósito: sin parse_mode, nada del visitante se interpreta.
    async send(threadId, text) {
      const payload: Record<string, unknown> = { chat_id: groupId, text };
      if (threadId) payload.message_thread_id = threadId;
      return Number((await call("sendMessage", payload)).message_id);
    },
  };
}
