// Tipos compartidos entre Edge Functions y tests.
export type Sender = "visitor" | "agent" | "system";

export type Session = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  telegram_thread_id: number | null;
  last_seen_at: string;
};

export type Settings = Record<string, string>;

export const TEMPLATE_KEYS = ["contact_ack", "contact_notify", "chat_reply"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type Template = { subject: string; html: string };

export const SECRET_NAMES = ["telegram_bot_token", "resend_api_key", "telegram_webhook_secret"] as const;
export type SecretName = (typeof SECRET_NAMES)[number];
export const EDITABLE_SECRETS: readonly SecretName[] = ["telegram_bot_token", "resend_api_key"];

export type MessageInsert = {
  session_id: string;
  sender: Sender;
  body: string;
  telegram_message_id?: number | null;
  media_path?: string | null;
};

// Fotos del chat (bucket privado "chat-media", carpeta = id de la sesión).
export interface Media {
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  download(path: string): Promise<Uint8Array>;
}

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  company: string; // empresa (opcional)
  business: string;
  message: string;
  meeting: boolean; // pidió reunión por Microsoft Teams
  meeting_pref: string; // día/horario preferido (opcional)
};
export type ContactRecord = ContactInput & { ip_hash: string };

export type HandlerResult = { status: number; json: Record<string, unknown> };

// Acceso a datos. En producción lo implementa supabaseStore.ts; en tests, FakeStore.
export interface Store {
  settings(): Promise<Settings>;
  secret(name: SecretName): Promise<string | null>;
  sessionForUser(userId: string): Promise<Session | null>;
  sessionByThread(threadId: number): Promise<Session | null>;
  createSession(userId: string, name: string, contact: string): Promise<Session>;
  setThread(sessionId: string, threadId: number): Promise<void>;
  addMessage(m: MessageInsert): Promise<{ id: string }>;
  markEmailed(messageId: string): Promise<void>;
  countRecent(bucket: string, windowMs: number): Promise<number>;
  hit(bucket: string): Promise<void>;
  template(key: TemplateKey): Promise<Template | null>;
  saveContact(c: ContactRecord): Promise<{ id: string }>;
  setSetting(key: string, value: string): Promise<void>;
  // retomar el chat en otro navegador (PIN por email)
  openSessionByContact(email: string): Promise<Session | null>;
  savePin(sessionId: string, hash: string, expiresAt: string): Promise<void>;
  getPin(sessionId: string): Promise<{ hash: string; expires_at: string; attempts: number } | null>;
  bumpPinAttempts(sessionId: string): Promise<void>;
  deletePin(sessionId: string): Promise<void>;
  transferSession(sessionId: string, userId: string): Promise<void>;
}
