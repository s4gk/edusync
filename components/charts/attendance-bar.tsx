"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

export type AttendancePoint = { dia: string; valor: number };

export function AttendanceBar({ data = [] }: { data?: AttendancePoint[] }) {
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-subtle">Sin registros de asistencia esta semana.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--c-brand)", fillOpacity: 0.08 }}
          formatter={(value: number) => [`${value}%`, "Asistencia"]}
          contentStyle={{
            borderRadius: 12,
            background: "var(--chart-tooltip-bg)",
            border: "1px solid var(--chart-tooltip-border)",
            color: "var(--ink)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill="var(--c-brand)" fillOpacity={d.valor >= 90 ? 1 : d.valor >= 75 ? 0.7 : 0.4} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
