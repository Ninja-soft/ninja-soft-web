import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_KEY, SUPABASE_URL } from "./config";

export { SUPABASE_KEY, SUPABASE_URL };

let visitor: SupabaseClient | null = null;
let internal: SupabaseClient | null = null;

// Sesiones separadas: el visitante anónimo del chat y el admin de /internal no se pisan.
export function visitorClient(): SupabaseClient {
  return (visitor ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: "ns-chat" } }));
}

export function internalClient(): SupabaseClient {
  return (internal ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: "ns-internal" } }));
}
