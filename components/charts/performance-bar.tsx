"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";

export type PerformancePoint = { grado: string; actual: number | null; anterior: number | null };

export function PerformanceBar({ data = [] }: { data?: PerformancePoint[] }) {
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-subtle">Sin notas registradas para el periodo.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 0, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeOpacity={0.5} />
        <XAxis
          dataKey="grado"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--c-brand)", fillOpacity: 0.08 }}
          contentStyle={{
            borderRadius: 12,
            background: "var(--chart-tooltip-bg)",
            border: "1px solid var(--chart-tooltip-border)",
            color: "var(--ink)",
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(16,16,24,0.08)",
          }}
          labelStyle={{ fontWeight: 600, color: "var(--ink)" }}
        />
        <Bar dataKey="actual" name="Este periodo" fill="var(--c-brand)" radius={[4, 4, 0, 0]} maxBarSize={14}>
          <LabelList
            dataKey="actual"
            position="top"
            style={{ fontSize: 10, fontWeight: 600, fill: "var(--ink)" }}
          />
        </Bar>
        <Bar
          dataKey="anterior"
          name="Periodo anterior"
          fill="var(--chart-baseline)"
          radius={[4, 4, 0, 0]}
          maxBarSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
