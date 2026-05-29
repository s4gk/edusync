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

const DATA = [
  { grado: "Pre-J", actual: 4.5, anterior: 4.3 },
  { grado: "Jardín", actual: 4.4, anterior: 4.2 },
  { grado: "Trans", actual: 4.6, anterior: 4.4 },
  { grado: "1°", actual: 4.3, anterior: 4.1 },
  { grado: "2°", actual: 4.2, anterior: 4.0 },
  { grado: "3°", actual: 4.1, anterior: 4.2 },
  { grado: "4°", actual: 4.4, anterior: 4.3 },
  { grado: "5°", actual: 4.3, anterior: 4.1 },
  { grado: "6°", actual: 4.0, anterior: 3.8 },
  { grado: "7°", actual: 3.9, anterior: 4.0 },
  { grado: "8°", actual: 4.2, anterior: 4.0 },
];

export function PerformanceBar() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={DATA} margin={{ top: 18, right: 0, left: -28, bottom: 0 }}>
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
          cursor={{ fill: "#5749F4", fillOpacity: 0.06 }}
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
        <Bar dataKey="actual" name="Este periodo" fill="#5749F4" radius={[4, 4, 0, 0]} maxBarSize={14}>
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
