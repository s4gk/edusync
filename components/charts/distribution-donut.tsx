"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export type DistributionPoint = { name: string; scale?: string; value: number; count?: number };

const COLOR: Record<string, string> = {
  Superior: "var(--c-brand)",
  Alto: "var(--c-green)",
  Básico: "var(--c-amber)",
  Bajo: "var(--c-red)",
};

export function DistributionDonut({ data = [] }: { data?: DistributionPoint[] }) {
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-subtle">Sin distribución de desempeño aún.</div>;
  }
  const superiorAlto = data.filter((d) => d.name === "Superior" || d.name === "Alto").reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-full min-h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={COLOR[d.name] ?? "var(--c-brand)"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{
              borderRadius: 12,
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
              color: "var(--ink)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-bold leading-none text-ink">{superiorAlto}%</span>
        <span className="mt-1 text-[11px] text-subtle">Superior + Alto</span>
      </div>
    </div>
  );
}
