// Extrae el { error } que devuelven nuestras Edge Functions.
export async function functionError(err: unknown, fallback: string): Promise<string> {
  const ctx = (err as { context?: unknown } | null)?.context;
  if (ctx instanceof Response) {
    const j = (await ctx.json().catch(() => null)) as { error?: string } | null;
    if (j?.error) return j.error;
  }
  return fallback;
}
