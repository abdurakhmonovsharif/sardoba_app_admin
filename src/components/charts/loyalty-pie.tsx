"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { LoyaltyAnalytics } from "@/types";

const COLORS = ["#2563eb", "#38bdf8", "#f97316", "#22c55e", "#a855f7"];

interface Props {
  data?: LoyaltyAnalytics;
}

export function LoyaltyPieChart({ data }: Props) {
  if (!data) return null;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data.tierCounts} dataKey="users" nameKey="tier" innerRadius={60} outerRadius={90} paddingAngle={2}>
            {data.tierCounts.map((entry, index) => (
              <Cell key={`cell-${entry.tier}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
