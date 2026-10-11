import { describe, expect, test } from "vitest";
import { escapeHtml, renderTemplate } from "../supabase/functions/_shared/template.ts";

describe("renderTemplate", () => {
  test("reemplaza variables con o sin espacios", () => {
    expect(renderTemplate("Hola {{nombre}} / {{ nombre }}", { nombre: "Ana" })).toBe("Hola Ana / Ana");
  });
  test("escapa HTML y convierte saltos de línea", () => {
    expect(renderTemplate("<p>{{mensaje}}</p>", { mensaje: '<b>x</b> & "y"\nz' })).toBe(
      "<p>&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;<br>z</p>",
    );
  });
  test("variables faltantes o desconocidas quedan vacías, nunca 'undefined'", () => {
    expect(renderTemplate("[{{telefono}}][{{foo}}]", {})).toBe("[][]");
  });
  test("modo texto (asunto) no escapa", () => {
    expect(renderTemplate("Nuevo: {{nombre}}", { nombre: "A&B" }, { html: false })).toBe("Nuevo: A&B");
  });
  test("escapeHtml cubre comillas simples", () => {
    expect(escapeHtml("'")).toBe("&#39;");
  });
});
