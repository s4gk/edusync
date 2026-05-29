"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DATA = [
  { name: "Superior", value: 32, color: "#5749F4" },
  { name: "Alto", value: 46, color: "#003300" },
  { name: "Básico", value: 18, color: "#4D2700" },
  { name: "Bajo", value: 4, color: "#590F00" },
];

export function DistributionDonut() {
  return (
    <div className="relative h-[170px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={DATA}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {DATA.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #C5C5CB",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-bold leading-none text-ink">78%</span>
        <span className="mt-1 text-[11px] text-subtle">Superior + Alto</span>
      </div>
    </div>
  );
}
