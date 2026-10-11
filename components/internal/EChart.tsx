"use client";

import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";

// ECharts sólo en /internal: se importa bajo demanda (no pesa en el sitio público).
// Tema oscuro de la casa: textos lavanda, grillas sutiles, naranja de marca.
export const CHART_COLORS = ["#ff6a1a", "#7c4dff", "#ffd21f", "#2db8a3", "#3b82f6", "#e8456b", "#a855f7", "#16a34a"];

const BASE: EChartsOption = {
  backgroundColor: "transparent",
  color: CHART_COLORS,
  textStyle: { color: "#a99fd0", fontFamily: "Inter, system-ui, sans-serif" },
  tooltip: {
    backgroundColor: "#15103a",
    borderColor: "rgba(255,255,255,.1)",
    textStyle: { color: "#f4f2ff", fontSize: 13 },
    extraCssText: "border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.4);",
  },
};

export function EChart({ option, height = 280 }: { option: EChartsOption; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const optionRef = useRef(option);
  optionRef.current = option;
  const chart = useRef<{ setOption: (o: EChartsOption, notMerge?: boolean) => void; resize: () => void; dispose: () => void } | null>(null);

  useEffect(() => {
    let alive = true;
    let ro: ResizeObserver | null = null;
    (async () => {
      const echarts = await import("echarts");
      if (!alive || !ref.current) return;
      const c = echarts.init(ref.current, undefined, { renderer: "canvas" });
      chart.current = c;
      c.setOption({ ...BASE, ...optionRef.current } as EChartsOption, true);
      ro = new ResizeObserver(() => c.resize());
      ro.observe(ref.current);
    })();
    return () => {
      alive = false;
      ro?.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chart.current?.setOption({ ...BASE, ...option } as EChartsOption, true);
  }, [option]);

  return <div ref={ref} style={{ height }} className="w-full" />;
}

export const axisStyle = {
  axisLine: { lineStyle: { color: "rgba(255,255,255,.12)" } },
  axisTick: { show: false },
  axisLabel: { color: "#a99fd0", fontSize: 11 },
  splitLine: { lineStyle: { color: "rgba(255,255,255,.06)", type: "dashed" as const } },
};
