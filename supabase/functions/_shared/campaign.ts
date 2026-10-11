import { renderTemplate, type TemplateData } from "./template.ts";

// Campañas: personaliza cada email y garantiza que siempre lleve el link de baja.
export function renderCampaign(
  subject: string,
  html: string,
  contact: { name: string; email: string },
  unsubscribeUrl: string,
  brand: TemplateData,
): { subject: string; html: string } {
  const data: TemplateData = { ...brand, nombre: contact.name, email: contact.email, link_baja: unsubscribeUrl };
  let body = html;
  if (!/\{\{\s*link_baja\s*\}\}/.test(body)) {
    const foot = `<p style="margin:24px 0 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af">¿No querés recibir más emails? <a href="{{link_baja}}" style="color:#9ca3af">Darme de baja</a></p>`;
    body = /<\/body>/i.test(body) ? body.replace(/<\/body>/i, `${foot}</body>`) : body + foot;
  }
  return { subject: renderTemplate(subject, data, { html: false }), html: renderTemplate(body, data) };
}

export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
