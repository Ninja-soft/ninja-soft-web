// Plantillas de email: {{variable}} con escape HTML.
export const TEMPLATE_VARS = [
  "nombre",
  "email",
  "telefono",
  "empresa",
  "rubro",
  "mensaje",
  "respuesta",
  "fecha",
  "link_sitio",
  "reunion",
  "logo_soft",
  "logo_pos",
  "logo_food",
  "logo_soft_claro",
  "logo_pos_claro",
  "logo_food_claro",
  "link_baja",
] as const;
export type TemplateVar = (typeof TEMPLATE_VARS)[number];
export type TemplateData = Partial<Record<TemplateVar, string>>;

// Logos de cada unidad de negocio (configurables en /internal → Ajustes).
export function brandVars(s: Record<string, string | undefined>): TemplateData {
  // logo_x: texto blanco (fondo oscuro) · logo_x_claro: texto negro (fondo claro)
  return {
    logo_soft: s.logo_soft_url ?? "",
    logo_pos: s.logo_pos_url ?? "",
    logo_food: s.logo_food_url ?? "",
    logo_soft_claro: s.logo_soft_claro_url ?? "",
    logo_pos_claro: s.logo_pos_claro_url ?? "",
    logo_food_claro: s.logo_food_claro_url ?? "",
  };
}

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
