import { expect, test } from "vitest";
import { chunk, renderCampaign } from "../supabase/functions/_shared/campaign.ts";

const contact = { name: "Ana <b>", email: "ana@mail.com" };

test("personaliza con nombre escapado y link de baja", () => {
  const r = renderCampaign("Hola {{nombre}}", "<p>Hola {{nombre}} · <a href=\"{{link_baja}}\">baja</a></p>", contact, "https://x/baja?t=1", {});
  expect(r.subject).toBe("Hola Ana <b>");
  expect(r.html).toBe('<p>Hola Ana &lt;b&gt; · <a href="https://x/baja?t=1">baja</a></p>');
});

test("si la plantilla no trae {{link_baja}}, se agrega un pie con el link (nunca sale sin baja)", () => {
  const r = renderCampaign("Novedades", "<p>Hola</p>", contact, "https://x/baja?t=2", {});
  expect(r.html).toContain("https://x/baja?t=2");
  expect(r.html).toContain("Darme de baja");
});

test("chunk parte en lotes", () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  expect(chunk([], 100)).toEqual([]);
});
