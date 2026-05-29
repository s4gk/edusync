"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const DATA = [
  { mes: "Dic", matriculas: 30, pensiones: 45, otros: 15 },
  { mes: "Ene", matriculas: 28, pensiones: 50, otros: 18 },
  { mes: "Feb", matriculas: 25, pensiones: 40, otros: 15 },
  { mes: "Mar", matriculas: 30, pensiones: 48, otros: 16 },
  { mes: "Abr", matriculas: 32, pensiones: 52, otros: 14 },
  { mes: "May", matriculas: 35, pensiones: 55, otros: 18 },
];

export function IncomeBar() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#616167" }}
        />
        <Tooltip
          cursor={{ fill: "#5749F4", fillOpacity: 0.06 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #C5C5CB",
            fontSize: 12,
          }}
        />
        <Bar dataKey="matriculas" name="Matrículas" stackId="a" fill="#5749F4" maxBarSize={28} />
        <Bar dataKey="pensiones" name="Pensiones" stackId="a" fill="#003300" maxBarSize={28} />
        <Bar
          dataKey="otros"
          name="Otros"
          stackId="a"
          fill="#4D2700"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
