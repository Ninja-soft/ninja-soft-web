import { describe, expect, test } from "vitest";
import { parseAgentUpdate, telegramApi, topicName, TOPIC_NAME_MAX } from "../supabase/functions/_shared/telegram.ts";

const G = "-1003773063419";
const msg = (m: Record<string, unknown>) => ({
  update_id: 1,
  message: {
    message_id: 50,
    chat: { id: Number(G) },
    from: { id: 7, is_bot: false },
    is_topic_message: true,
    message_thread_id: 12,
    text: "Hola, ¿cómo estás?",
    ...m,
  },
});

describe("topicName", () => {
  test("nombre · contacto", () => {
    expect(topicName("Ana", "ana@mail.com")).toBe("Ana · ana@mail.com");
  });
  test("recorta a 128 caracteres reales (emojis incluidos)", () => {
    const t = topicName("🔥".repeat(100), "x".repeat(100));
    expect([...t].length).toBe(TOPIC_NAME_MAX);
    expect(t.endsWith("…")).toBe(true);
  });
});

describe("parseAgentUpdate", () => {
  test("respuesta humana dentro de un tema", () => {
    expect(parseAgentUpdate(msg({}), G)).toEqual({ threadId: 12, text: "Hola, ¿cómo estás?", messageId: 50 });
  });
  test("ignora otro chat, bots, General, stickers/fotos y updates raros", () => {
    expect(parseAgentUpdate(msg({ chat: { id: 1 } }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ from: { id: 9, is_bot: true } }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ is_topic_message: undefined, message_thread_id: undefined }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ text: undefined, sticker: { file_id: "x" } }), G)).toBeNull();
    expect(parseAgentUpdate(msg({ text: "   " }), G)).toBeNull();
    expect(parseAgentUpdate({ update_id: 2, edited_message: {} }, G)).toBeNull();
    expect(parseAgentUpdate(null, G)).toBeNull();
  });
});

describe("telegramApi", () => {
  test("manda texto plano (sin parse_mode) al tema", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ ok: true, result: { message_id: 99 } }));
    }) as unknown as typeof fetch;
    const id = await telegramApi("t", G, fakeFetch).send(12, "<b>*hola*_</b> & 🔥");
    expect(id).toBe(99);
    expect(bodies[0]).toEqual({ chat_id: G, text: "<b>*hola*_</b> & 🔥", message_thread_id: 12 });
    expect("parse_mode" in bodies[0]).toBe(false);
  });
  test("si Telegram responde ok:false, lanza error", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ ok: false, description: "Bad Request: message thread not found" }))) as unknown as typeof fetch;
    await expect(telegramApi("t", G, fakeFetch).send(12, "x")).rejects.toThrow("message thread not found");
  });
});
