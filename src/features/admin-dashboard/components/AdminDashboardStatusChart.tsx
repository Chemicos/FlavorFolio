import { AdminDashboardStatusItem } from "../types/adminDashboard.types"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const STATUS_COLORS: Record<AdminDashboardStatusItem["status"], string> = {
  published: "#22c55e",
  pending: "#8b5cf6",
  needs_revision: "#feaa2b",
}

export default function AdminDashboardStatusChart({
  data,
  totalRecipes,
}: {
  data: AdminDashboardStatusItem[]
  totalRecipes: number
}) {
  const visibleData = data.filter((item) => item.value > 0)

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={2}>
              {data.map((item, index) => (
                <Cell key={item.status} fill={STATUS_COLORS[item.status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0d0e11",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col justify-center gap-3">
        {data.map((item, index) => (
          <div key={item.status} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-[#d7def0]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              {item.label}
            </div>

            <div className="text-right">
              <span className="font-semibold text-white">{item.value}</span>
              <span className="ml-2 text-[#8f97b1]">
                {totalRecipes ? `${((item.value / totalRecipes) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
