"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

const DATA = [
  { dia: "L", valor: 92, op: 1 },
  { dia: "M", valor: 94, op: 1 },
  { dia: "M", valor: 96, op: 1 },
  { dia: "J", valor: 93, op: 1 },
  { dia: "V", valor: 97, op: 1 },
  { dia: "S", valor: 70, op: 0.4 },
  { dia: "D", valor: 40, op: 0.25 },
];

export function AttendanceBar() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
        />
        <Tooltip
          cursor={{ fill: "#5749F4", fillOpacity: 0.06 }}
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
          {DATA.map((d, i) => (
            <Cell key={i} fill="#5749F4" fillOpacity={d.op} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
