import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import AdminDashboardChartCard from "./AdminDashboardChartCard"
import { useAdminReportsFood } from "../hooks/useAdminReportsFood"
import { ReportsChartSkeleton } from "./skeletons/AdminReportsSkeletons"

interface AdminReportsFoodSectionProps {
  refreshKey?: number
  highlightedSection?: "top-cuisines" | "top-ingredients" | "meal-types" | null
}

const PIE_COLORS = ["var(--chart-series-1)", "var(--chart-series-2)", "var(--chart-series-3)", "var(--chart-series-4)", "var(--chart-series-5)"]

const tooltipStyle = {
  background: "var(--tooltip-bg)",
  border: "1px solid var(--tooltip-border)",
  borderRadius: 12,
  color: "var(--tooltip-text)",
  boxShadow: "var(--shadow-dropdown)",
}

function BarChartBlock({
  data,
  dataKey = "value",
}: {
  data: any[]
  dataKey?: string
}) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip 
            contentStyle={tooltipStyle} 
            labelStyle={{ color: "var(--tooltip-text)", }}
            itemStyle={{ color: "var(--tooltip-text)", }}
            cursor={{ fill: "var(--accent-soft)", }} 
          />
          <Bar dataKey={dataKey} fill="var(--accent)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieChartBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="grid h-[300px] items-center gap-6 md:grid-cols-[300px_1fr]">
      <div className="h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={82}
              outerRadius={120}
              paddingAngle={2}
            >
              {data.map((_entry, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex h-full flex-col justify-center gap-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
            </div>

            <span className="text-sm font-bold text-[var(--text-primary)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressList({
  data,
  labelKey = "name",
}: {
  data: any[]
  labelKey?: "name" | "label"
}) {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1)

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item[labelKey]} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{item[labelKey]}</p>
            <p className="text-sm font-semibold text-[var(--accent-text)]">{item.value}</p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function getHighlightClass(
  current: string,
  highlighted?: string | null
) {
  return current === highlighted
    ? "animate-pulse rounded-2xl ring-2 ring-[var(--accent-border)] shadow-[0_0_45px_var(--accent-soft-hover)]"
    : ""
}

export default function AdminReportsFoodSection({
  refreshKey = 0,
  highlightedSection = null,
}: AdminReportsFoodSectionProps) {
  const { food, isLoading, error } = useAdminReportsFood(refreshKey)

  if (isLoading) {
    return (
      <div className="mt-8 space-y-6">
        <section className="grid gap-6 xl:grid-cols-2">
          <ReportsChartSkeleton />
          <ReportsChartSkeleton />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ReportsChartSkeleton height={240} />
          <ReportsChartSkeleton height={240} />
        </section>

        <ReportsChartSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger-text)]">
        {error}
      </div>
    )
  }

  if (!food) return null

  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <div
            className={getHighlightClass("top-cuisines", highlightedSection)} 
        >
            <AdminDashboardChartCard title="Most Used Cuisines">
                <BarChartBlock data={food.topCuisines} />
            </AdminDashboardChartCard>
        </div>

        <div 
            className={getHighlightClass("meal-types", highlightedSection)}
        >
            <AdminDashboardChartCard title="Most Used Meal Types">
                <PieChartBlock data={food.mealTypes} />
            </AdminDashboardChartCard>
        </div>
      </section>
      
      <div
        className={getHighlightClass("top-ingredients", highlightedSection)}
      >
        <AdminDashboardChartCard title="Top 20 Ingredients">
            <BarChartBlock data={food.topIngredients.slice(0, 20)} />
        </AdminDashboardChartCard>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminDashboardChartCard title="Difficulty Distribution">
          <ProgressList data={food.difficultyDistribution} />
        </AdminDashboardChartCard>

        <AdminDashboardChartCard title="Average Cooking Time">
          <ProgressList data={food.cookingTimeDistribution} labelKey="label" />
        </AdminDashboardChartCard>
      </section>
    </div>
  )
}
