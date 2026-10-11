// Valores públicos de Supabase (URL + publishable key). Sin importar la librería, para que las
// partes livianas del sitio (medición, formulario, baja) no carguen supabase-js.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tgaromemhaixgdsdlxiq.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn";

// Llamada directa a una Edge Function pública. Devuelve el JSON o lanza Error con el mensaje del servidor.
export async function callFunction<T = Record<string, unknown>>(name: string, body: unknown, fallback: string): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!r.ok) throw new Error(data?.error ?? fallback);
  return data as T;
}
