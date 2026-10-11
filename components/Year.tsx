"use client";

import { useEffect, useState } from "react";

// El sitio es estático: el año del build queda como valor inicial y el
// navegador lo actualiza al año actual al cargar.
export function Year({ initial }: { initial: number }) {
  const [year, setYear] = useState(initial);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
