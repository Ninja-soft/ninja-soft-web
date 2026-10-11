// Plantillas de email: {{variable}} con escape HTML.
export const TEMPLATE_VARS = [
  "nombre",
  "email",
  "telefono",
  "rubro",
  "mensaje",
  "respuesta",
  "fecha",
  "link_sitio",
] as const;
export type TemplateVar = (typeof TEMPLATE_VARS)[number];
export type TemplateData = Partial<Record<TemplateVar, string>>;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTemplate(tpl: string, data: TemplateData, opts: { html: boolean } = { html: true }): string {
  const values = data as Record<string, string | undefined>;
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, key: string) => {
    const v = values[key] ?? "";
    return opts.html ? escapeHtml(v).replace(/\r?\n/g, "<br>") : v;
  });
}

export function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(ms));
}
