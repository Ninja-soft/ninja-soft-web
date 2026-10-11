import { obj } from "./validate.ts";

export const TOPIC_NAME_MAX = 128;

export function topicName(name: string, contact: string): string {
  const chars = [...`${name} · ${contact}`];
  return chars.length > TOPIC_NAME_MAX ? chars.slice(0, TOPIC_NAME_MAX - 1).join("") + "…" : chars.join("");
}

export type AgentReply = { threadId: number; text: string; messageId: number; photoFileId?: string };

// Sólo cuenta como respuesta un texto de una persona, dentro de un tema del grupo configurado.
export function parseAgentUpdate(update: unknown, groupId: string): AgentReply | null {
  const m = obj(obj(update).message);
  if (!Object.keys(m).length) return null;
  if (String(obj(m.chat).id) !== groupId) return null;
  if (obj(m.from).is_bot === true) return null;
  if (m.is_topic_message !== true || typeof m.message_thread_id !== "number") return null;
  const base = { threadId: m.message_thread_id, messageId: Number(m.message_id) };
  // Foto: Telegram manda varias resoluciones; la última es la más grande.
  if (Array.isArray(m.photo) && m.photo.length) {
    const fileId = String(obj(m.photo[m.photo.length - 1]).file_id ?? "");
    if (!fileId) return null;
    return { ...base, text: typeof m.caption === "string" ? m.caption.trim() : "", photoFileId: fileId };
  }
  if (typeof m.text !== "string" || !m.text.trim()) return null;
  return { ...base, text: m.text.trim() };
}

export type TelegramApi = {
  createTopic(name: string): Promise<number>;
  send(threadId: number | null, text: string): Promise<number>;
  sendPhoto(threadId: number | null, bytes: Uint8Array, filename: string, caption: string): Promise<number>;
  downloadFile(fileId: string): Promise<{ bytes: Uint8Array; contentType: string }>;
};

export function telegramApi(token: string, groupId: string, fetchFn: typeof fetch = fetch): TelegramApi {
  async function call(method: string, payload: Record<string, unknown> | FormData) {
    const r = await fetchFn(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      ...(payload instanceof FormData
        ? { body: payload }
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
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
    async sendPhoto(threadId, bytes, filename, caption) {
      const form = new FormData();
      form.set("chat_id", groupId);
      if (threadId) form.set("message_thread_id", String(threadId));
      if (caption) form.set("caption", caption.slice(0, 1024));
      form.set("photo", new Blob([bytes as unknown as BlobPart]), filename);
      return Number((await call("sendPhoto", form)).message_id);
    },
    async downloadFile(fileId) {
      const file = await call("getFile", { file_id: fileId });
      const r = await fetchFn(`https://api.telegram.org/file/bot${token}/${String(file.file_path)}`);
      if (!r.ok) throw new Error(`Telegram getFile: ${r.status}`);
      return { bytes: new Uint8Array(await r.arrayBuffer()), contentType: r.headers.get("content-type") ?? "image/jpeg" };
    },
  };
}
