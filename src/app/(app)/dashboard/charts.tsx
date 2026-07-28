"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui";

type ChartDatum = { name: string; value: number };

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

export function DashboardCharts({
  categoryChart,
  departmentChart,
  locationChart,
  conditionChart,
}: {
  categoryChart: ChartDatum[];
  departmentChart: ChartDatum[];
  locationChart: ChartDatum[];
  conditionChart: ChartDatum[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Asset by Category</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryChart} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Asset by Department</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={departmentChart} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Asset by Location</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={locationChart} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Asset Condition</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={conditionChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {conditionChart.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
