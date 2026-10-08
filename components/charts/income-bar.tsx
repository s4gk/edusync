"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

export type IncomePoint = { mes: string; facturado: number; recaudado: number };

const copCompact = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0, notation: "compact" }).format(n);

export function IncomeBar({ data = [] }: { data?: IncomePoint[] }) {
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-subtle">Sin datos de ingresos para el año lectivo.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--chart-axis)" }} />
        <Tooltip
          cursor={{ fill: "var(--c-brand)", fillOpacity: 0.08 }}
          formatter={(value: number, name) => [copCompact(value), name === "facturado" ? "Facturado" : "Recaudado"]}
          contentStyle={{
            borderRadius: 12,
            background: "var(--chart-tooltip-bg)",
            border: "1px solid var(--chart-tooltip-border)",
            color: "var(--ink)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === "facturado" ? "Facturado" : "Recaudado")} />
        <Bar dataKey="facturado" name="facturado" fill="var(--c-income-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="recaudado" name="recaudado" fill="var(--c-income-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
