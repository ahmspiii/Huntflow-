"use client";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

const COLORS = ["#5aa9d6", "#4fb69a", "#7c5cbf", "#e0a84b", "#e06c6c", "#6ed0e0", "#a78bfa", "#f9a8d4"];

export default function TacticChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" allowDecimals={false} stroke="#8a97a8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={150} stroke="#8a97a8" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#141a22",
            border: "1px solid #26303d",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            fontSize: "12px",
          }}
          cursor={{ fill: "rgba(90, 169, 214, 0.05)" }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
