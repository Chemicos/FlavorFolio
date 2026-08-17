import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AdminDashboardActivityItem } from "../types/adminDashboard.types"

export default function AdminDashboardActivityChart({data}: {data: AdminDashboardActivityItem[]}) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="recipesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#feaa2b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#feaa2b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

          <XAxis
            dataKey="label"
            stroke="#8f97b1"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />

          <YAxis
            stroke="#8f97b1"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <Tooltip
            cursor={{ stroke: "rgba(254,170,43,0.28)" }}
            contentStyle={{
              background: "#0d0e11",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
            }}
            labelStyle={{
              color: "#d7def0",
            }}
          />

          <Area
            type="monotone"
            dataKey="recipes"
            name="Recipes"
            stroke="#feaa2b"
            fill="url(#recipesGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
