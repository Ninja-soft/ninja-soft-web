"""Convierte imágenes a WebP para public/images/.

Uso:
    python scripts/to-webp.py <origen> <destino.webp> [--width 640]

- Recorta los bordes transparentes.
- Redimensiona al ancho indicado (por defecto 640 px, sin agrandar si es menor x2).
- Guarda WebP calidad 90.

Regla del proyecto: toda imagen nueva entra como .webp, nombre en minúsculas
y kebab-case, dentro de la carpeta de su categoría (ver public/images/README.md).
Los SVG se rasterizan antes con Chrome (ver README).
"""

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--width", type=int, default=640)
    a = ap.parse_args()

    im = Image.open(a.src).convert("RGBA")
    box = im.getbbox()
    if box:
        im = im.crop(box)
    w = min(a.width, im.width * 2)
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    dst = Path(a.dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "WEBP", quality=90, method=6)
    print(f"{dst} {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
