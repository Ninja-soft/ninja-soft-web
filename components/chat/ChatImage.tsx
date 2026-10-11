"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DownloadSimple, X } from "@phosphor-icons/react";
import type { SupabaseClient } from "@supabase/supabase-js";

// Foto del chat: el bucket es privado, se muestra con una URL firmada de 1 hora.
export function ChatImage({ sb, path }: { sb: SupabaseClient; path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let alive = true;
    sb.storage
      .from("chat-media")
      .createSignedUrl(path, 3600)
      .then(({ data }) => alive && setUrl(data?.signedUrl ?? null));
    return () => {
      alive = false;
    };
  }, [sb, path]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  if (!url)
    return (
      <span role="status" className="flex h-40 w-56 flex-col items-center justify-center gap-2 rounded-[14px] bg-black/[.05] text-[12.5px] text-[#6e6e73]">
        <span className="chat-spinner" />
        Cargando foto…
      </span>
    );
  return (
    <>
      <button type="button" onClick={() => setZoom(true)} aria-label="Ver foto" className="block cursor-zoom-in">
        <img src={url} alt="Foto enviada en el chat" className="max-h-64 w-auto max-w-[240px] rounded-[14px] object-cover" />
      </button>
      {zoom &&
        createPortal(
          <div role="dialog" aria-label="Foto" className="photo-viewer" onClick={() => setZoom(false)}>
            <img src={url} alt="Foto enviada en el chat" className="photo-viewer-img" onClick={(e) => e.stopPropagation()} />
            <div className="absolute right-4 top-4 flex gap-2">
              <a href={url} download aria-label="Descargar" onClick={(e) => e.stopPropagation()} className="photo-viewer-btn">
                <DownloadSimple size={20} weight="bold" />
              </a>
              <button type="button" aria-label="Cerrar" onClick={() => setZoom(false)} className="photo-viewer-btn">
                <X size={20} weight="bold" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// Achica y pasa a JPEG antes de subir (fotos de celular de 4–12 MB → ~300 KB).
export async function compressImage(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la foto"))), "image/jpeg", 0.85),
  );
}
