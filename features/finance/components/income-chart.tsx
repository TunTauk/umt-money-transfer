"use client";

import { useState } from "react";

export type IncomeChartPoint = { label: string; detail: string; net: string; credits: string; reversals: string };
const money = (value: string | bigint) => `${BigInt(value).toLocaleString("en-US")} MMK`;
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function IncomeChart({ points, mode }: { points: IncomeChartPoint[]; mode: "daily" | "monthly" }) {
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((point) => BigInt(point.net));
  const maxPositive = values.reduce((max, value) => value > max ? value : max, 0n);
  const negative = values.reduce((max, value) => -value > max ? -value : max, 0n);
  const positive = maxPositive === 0n && negative === 0n ? 1n : maxPositive;
  const range = positive + negative;
  const height = 176;
  const top = 16;
  const left = 58;
  const width = 626;
  const scale = (value: bigint) => Number(value * BigInt(height * 1000) / range) / 1000;
  const baseline = top + scale(positive);
  const step = width / points.length;
  const selected = active === null ? null : points[active];
  const hasActivity = points.some((point) => BigInt(point.credits) !== 0n || BigInt(point.reversals) !== 0n);

  return <div>
    <div className="mb-3 flex min-h-14 flex-wrap items-start justify-between gap-2 text-sm" aria-live="polite">
      <div><p className="font-medium">{selected?.detail ?? (mode === "daily" ? "Hourly net fee income" : "Daily net fee income")}</p><p className="mt-1 text-xs text-muted-foreground">{selected ? `Fee credits: ${money(selected.credits)} · Reversed fees: ${money(selected.reversals)}` : "Hover over or focus a bar to see exact amounts."}</p></div>
      {selected ? <p className={`font-mono font-semibold ${BigInt(selected.net) < 0n ? "text-destructive" : "text-primary"}`}>{money(selected.net)}</p> : null}
    </div>
    {!hasActivity ? <p className="mb-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">No fee activity in this period.</p> : null}
    <div className="overflow-x-auto">
      <svg viewBox="0 0 704 234" className="h-[234px] w-full min-w-[560px]" role="group" aria-label={`${mode === "daily" ? "Hourly" : "Daily"} net fee income chart in MMK`}>
        {Array.from({ length: 5 }, (_, index) => {
          const y = top + height * index / 4;
          const value = Number(positive) - Number(range) * index / 4;
          return <g key={index}><line x1={left} x2={left + width} y1={y} y2={y} className="stroke-border" strokeDasharray="3 4" /><text x={left - 8} y={y + 4} textAnchor="end" fontSize="11" className="fill-muted-foreground">{compact.format(value)}</text></g>;
        })}
        <line x1={left} x2={left + width} y1={baseline} y2={baseline} className="stroke-muted-foreground" strokeOpacity="0.5" />
        {points.map((point, index) => {
          const value = values[index];
          const barHeight = Math.max(Math.abs(scale(value)), 2);
          const x = left + index * step + step * 0.16;
          const y = value >= 0n ? baseline - barHeight : baseline;
          const showLabel = index % (mode === "daily" ? 3 : 5) === 0 || index === points.length - 1;
          return <g key={point.detail}>
            <rect x={x} y={y} width={step * 0.68} height={barHeight} rx="3" tabIndex={0} role="img" aria-label={`${point.detail}: net ${money(point.net)}, credits ${money(point.credits)}, reversed fees ${money(point.reversals)}`} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} className={`${value < 0n ? "fill-destructive" : value === 0n ? "fill-border" : "fill-primary"} cursor-pointer outline-none transition-opacity focus:stroke-foreground focus:stroke-2`} opacity={active !== null && active !== index ? 0.45 : 1}><title>{`${point.detail}: ${money(point.net)}`}</title></rect>
            {showLabel ? <text x={left + index * step + step / 2} y={216} textAnchor="middle" fontSize="11" className="fill-muted-foreground">{point.label}</text> : null}
          </g>;
        })}
      </svg>
    </div>
    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Net income</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" />Net reversals</span><span className="ml-auto">{mode === "daily" ? "Hour" : "Day of month"} · Myanmar time</span></div>
  </div>;
}
