import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded"
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import { CircularProgress } from "@mui/material"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAdminReportsCommunity } from "../hooks/useAdminReportsCommunity"
import AdminDashboardChartCard from "./AdminDashboardChartCard"
import { useMemo, useState } from "react"
import { ReportsChartSkeleton, ReportsMetricSkeleton } from "./skeletons/AdminReportsSkeletons"

type CommunityMetricKey = "recipes" | "users" | "saves" | "comments"
type ChartMode = "absolute" | "growth"

interface AdminReportsCommunitySectionProps {
  refreshKey?: number
}

const tooltipStyle = {
  background: "#0d0e11",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
}

function getGrowthPercent(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0
  if (previous === 0) return 100

  return ((current - previous) / previous) * 100
}

function formatGrowth(value: number) {
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${value.toFixed(1)}%`
}

function getMetricTotal(data: any[], key: CommunityMetricKey) {
  return data.reduce((sum, item) => sum + Number(item[key] || 0), 0)
}

function buildGrowthChartData(data: any[], key: CommunityMetricKey) {
  return data.map((item, index) => {
    const previous = index > 0 ? Number(data[index - 1][key] || 0) : 0
    const current = Number(item[key] || 0)

    return {
      ...item,
      [`${key}Growth`]: Number(getGrowthPercent(current, previous).toFixed(1)),
    }
  })
}

function CommunityMetricCard({
  label,
  value,
  growth,
  icon,
}: {
  label: string
  value: number
  growth: number
  icon: React.ReactNode
}) {
  const isPositive = growth >= 0

  return (
    <div className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#8f97b1]">{label}</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{value}</h2>

          <div
            className={[
              "mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              isPositive
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-red-500/10 text-red-300",
            ].join(" ")}
          >
            {isPositive ? (
              <ArrowDropUpRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <ArrowDropDownRoundedIcon sx={{ fontSize: 18 }} />
            )}
            {formatGrowth(growth)}
          </div>

          <p className="mt-2 text-xs text-[#7f89a6]">vs previous month</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#feaa2b]/10 text-[#feaa2b]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function CommunityLineChart({
  data,
  dataKey,
  name,
  mode,
}: {
  data: any[]
  dataKey: CommunityMetricKey
  name: string
  mode: ChartMode
}) {
  const chartData = useMemo(() => {
    if (mode === "absolute") return data
    return buildGrowthChartData(data, dataKey)
  }, [data, dataKey, mode])

  const activeDataKey = mode === "absolute" ? dataKey : `${dataKey}Growth`

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

          <XAxis
            dataKey="label"
            stroke="#8f97b1"
            tickLine={false}
            axisLine={false}
            minTickGap={18}
          />

          <YAxis
            stroke="#8f97b1"
            tickLine={false}
            axisLine={false}
            allowDecimals={mode === "growth"}
            tickFormatter={(value) =>
              mode === "growth" ? `${value}%` : String(value)
            }
          />

          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "rgba(254,170,43,0.25)" }}
            labelStyle={{ color: "#d7def0" }}
            formatter={(value) => [
              mode === "growth" ? `${Number(value).toFixed(1)}%` : value,
              mode === "growth" ? `${name} growth` : name,
            ]}
          />

          <Line
            type="monotone"
            dataKey={activeDataKey}
            name={name}
            stroke="#feaa2b"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AdminReportsCommunitySection({
  refreshKey = 0,
}: AdminReportsCommunitySectionProps) {
  const { community, isLoading, error } = useAdminReportsCommunity(refreshKey)
  const [chartMode, setChartMode] = useState<ChartMode>("absolute")

  if (isLoading) {
    return (
      <div className="mt-8 space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ReportsMetricSkeleton key={index} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <ReportsChartSkeleton key={index} />
          ))}
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
        {error}
      </div>
    )
  }

  if (!community) return null

  const data = community.monthlyActivity
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]

  const metrics = [
    {
      label: "Recipes",
      key: "recipes" as const,
      value: getMetricTotal(data, "recipes"),
      growth: getGrowthPercent(currentMonth?.recipes || 0, previousMonth?.recipes || 0),
      icon: <RestaurantRoundedIcon />,
    },
    {
      label: "Users",
      key: "users" as const,
      value: getMetricTotal(data, "users"),
      growth: getGrowthPercent(currentMonth?.users || 0, previousMonth?.users || 0),
      icon: <PeopleAltRoundedIcon />,
    },
    {
      label: "Saves",
      key: "saves" as const,
      value: getMetricTotal(data, "saves"),
      growth: getGrowthPercent(currentMonth?.saves || 0, previousMonth?.saves || 0),
      icon: <BookmarkRoundedIcon />,
    },
    {
      label: "Comments",
      key: "comments" as const,
      value: getMetricTotal(data, "comments"),
      growth: getGrowthPercent(currentMonth?.comments || 0, previousMonth?.comments || 0),
      icon: <ChatBubbleRoundedIcon />,
    },
  ]

  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <CommunityMetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            growth={metric.growth}
            icon={metric.icon}
          />
        ))}
      </section>

      <div className="flex justify-end">
        <div className="inline-flex rounded-xl border border-white/10 bg-[#0b0b0c] p-1">
          <button
            type="button"
            onClick={() => setChartMode("absolute")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              chartMode === "absolute"
                ? "bg-[#feaa2b]/15 text-[#ffd28a]"
                : "text-[#8f97b1] hover:text-white",
            ].join(" ")}
          >
            Absolute values
          </button>

          <button
            type="button"
            onClick={() => setChartMode("growth")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              chartMode === "growth"
                ? "bg-[#feaa2b]/15 text-[#ffd28a]"
                : "text-[#8f97b1] hover:text-white",
            ].join(" ")}
          >
            Growth %
          </button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminDashboardChartCard title="Recipes Created / Month">
          <CommunityLineChart data={data} dataKey="recipes" name="Recipes" mode={chartMode} />
        </AdminDashboardChartCard>

        <AdminDashboardChartCard title="New Users / Month">
          <CommunityLineChart data={data} dataKey="users" name="Users" mode={chartMode} />
        </AdminDashboardChartCard>

        <AdminDashboardChartCard title="Saved Recipes / Month">
          <CommunityLineChart data={data} dataKey="saves" name="Saves" mode={chartMode} />
        </AdminDashboardChartCard>

        <AdminDashboardChartCard title="Comments / Month">
          <CommunityLineChart data={data} dataKey="comments" name="Comments" mode={chartMode} />
        </AdminDashboardChartCard>
      </section>
    </div>
  )
}