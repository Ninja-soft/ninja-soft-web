import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Valores públicos (URL + publishable key): pueden ir en el bundle.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tgaromemhaixgdsdlxiq.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn";

let visitor: SupabaseClient | null = null;
let internal: SupabaseClient | null = null;

// Sesiones separadas: el visitante anónimo del chat y el admin de /internal no se pisan.
export function visitorClient(): SupabaseClient {
  return (visitor ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: "ns-chat" } }));
}

export function internalClient(): SupabaseClient {
  return (internal ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: "ns-internal" } }));
}
