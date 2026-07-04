import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded"
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded"
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import StarRoundedIcon from "@mui/icons-material/StarRounded"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import CircularProgress from "@mui/material/CircularProgress"
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import { useAdminDashboardStats } from "../hooks/useAdminDashboardStats"

import Navigation from "../../../components/layout/Navigation"
import AdminDashboardMetricsCard from "../components/AdminDashboardMetricsCard"
import AdminDashboardChartCard from "../components/AdminDashboardChartCard"
import AdminDashboardStatusChart from "../components/AdminDashboardStatusChart"
import AdminDashboardActivityChart from "../components/AdminDashboardActivityChart"
import AdminDashboardTopRecipes from "../components/AdminDashboardTopRecipes"
import AdminDashboardActivityCh from "../components/AdminDashboardActivityCh"
import { AdminDashboardTimeRange } from "../types/adminDashboard.types"
import { useMemo, useState } from "react"
import AdminDashboardSelect from "../components/AdminDashboardSelect"
import AdminDashboardSidebar from "../components/AdminDashboardSidebar"
import AdminLayout from "../components/AdminLayout"

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

const TIME_RANGE_OPTIONS: {
  label: string
  value: AdminDashboardTimeRange
  daysCount: number | "all"
}[] = [
  { label: "Last 30 days", value: "30d", daysCount: 30 },
  { label: "Last 90 days", value: "90d", daysCount: 90 },
  { label: "Last year", value: "1y", daysCount: 365 },
  { label: "All time", value: "all", daysCount: "all" },
]

function formatChartDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })
}

function buildRecipesOverTime(
  recipes: { createdAtMs: number }[],
  range: AdminDashboardTimeRange
) {
  const option = TIME_RANGE_OPTIONS.find((item) => item.value === range)
  const daysCount = option?.daysCount || 30

  if (daysCount === "all") {
    const buckets = new Map<string, number>()

    recipes.forEach((recipe) => {
      if (!recipe.createdAtMs) return

      const date = new Date(recipe.createdAtMs)

      const label = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })

      buckets.set(label, (buckets.get(label) || 0) + 1)
    })

    return Array.from(buckets.entries()).map(([label, recipes]) => ({
      label,
      recipes,
    }))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = new Map<string, number>()

  for (let index = daysCount - 1; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    buckets.set(formatChartDate(date), 0)
  }

  recipes.forEach((recipe) => {
    if (!recipe.createdAtMs) return

    const date = new Date(recipe.createdAtMs)
    date.setHours(0, 0, 0, 0)

    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays < 0 || diffDays >= daysCount) return

    const label = formatChartDate(date)
    buckets.set(label, (buckets.get(label) || 0) + 1)
  })

  return Array.from(buckets.entries()).map(([label, recipes]) => ({
    label,
    recipes,
  }))
}

export default function AdminDashboardPage() {
  const { stats, isLoading, error, refetch } = useAdminDashboardStats()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [recipesTimeRange, setRecipesTimeRange] = useState<AdminDashboardTimeRange>("30d")

  const recipesOverTime = useMemo(() => {
    if (!stats) return []

    return buildRecipesOverTime(
      stats.recipeTimelineSource,
      recipesTimeRange
    )
  }, [stats, recipesTimeRange])

  return (
    <AdminLayout>
      {/* <Navigation variant="solid" /> */}
{/* 
      <AdminDashboardSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
      /> */}

      {/* <main 
        className={[
          "w-full px-6 pb-16 pt-28 transition-all duration-300 xl:px-8",
          isSidebarCollapsed
            ? "xl:ml-[82px] xl:w-[calc(100%-82px)]"
            : "xl:ml-[260px] xl:w-[calc(100%-260px)]",
        ].join(" ")}
      > */}
        {/* <div className="mx-auto w-full max-w-[1400px]"> */}
          <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm text-[#8f97b1]">
                Overview of platform activity, moderation and recipe performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={refetch}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-[5px] text-sm font-semibold text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white"
              >
                <RefreshRoundedIcon sx={{ fontSize: 26 }} />
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#feaa2b]/10 px-4 py-2 text-sm font-semibold text-[#ffd28a] transition hover:bg-[#feaa2b]/15"
              >
                <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
                Export PDF
              </button>
            </div>
          </header>

          {isLoading && (
            <div className="flex h-[420px] items-center justify-center">
              <CircularProgress size={34} sx={{ color: "#feaa2b" }} />
            </div>
          )}

          {!isLoading && error && (
            <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
              {error}
            </div>
          )}

          {!isLoading && stats && (
            <div className="mt-8 space-y-6">
              <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <AdminDashboardMetricsCard
                  label="Total Users"
                  value={formatNumber(stats.totalUsers)}
                  helper="Live platform users"
                  icon={<PeopleRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Total Recipes"
                  value={formatNumber(stats.totalRecipes)}
                  helper={`${formatNumber(stats.publishedRecipes)} published`}
                  icon={<MenuBookRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Pending Reviews"
                  value={formatNumber(stats.pendingRecipes)}
                  helper="Waiting for moderation"
                  icon={<HourglassTopRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Needs Revision"
                  value={formatNumber(stats.needsRevisionRecipes)}
                  helper="Returned to creators"
                  icon={<WarningAmberRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Total Saves"
                  value={formatNumber(stats.totalSaves)}
                  helper="Across all recipes"
                  icon={<BookmarkRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Total Comments"
                  value={formatNumber(stats.totalComments)}
                  helper="Community activity"
                  icon={<ChatBubbleRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Avg. Rating"
                  value={stats.averageRating.toFixed(2)}
                  helper="Global recipe rating"
                  icon={<StarRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                  label="Reports"
                  value="PDF"
                  helper="Export-ready"
                  icon={<FileDownloadRoundedIcon />}
                />
              </section>

              <section className="grid gap-6 2xl:grid-cols-[1.05fr_1.2fr]">
                <AdminDashboardChartCard title="Recipe Status Distribution">
                  <AdminDashboardStatusChart
                    data={stats.statusDistribution}
                    totalRecipes={stats.totalRecipes}
                  />
                </AdminDashboardChartCard>

                <AdminDashboardChartCard
                  title="Recipes Over Time"
                  action={
                    <AdminDashboardSelect
                      value={recipesTimeRange}
                      options={TIME_RANGE_OPTIONS}
                      onChange={(value) =>
                        setRecipesTimeRange(
                          value as AdminDashboardTimeRange
                        )
                      }
                    />
                  }
                >
                  <AdminDashboardActivityChart
                    data={recipesOverTime}
                  />
                </AdminDashboardChartCard>
              </section>

              <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
                <AdminDashboardChartCard title="Top Saved Recipes">
                  <AdminDashboardTopRecipes recipes={stats.topSavedRecipes} />
                </AdminDashboardChartCard>

                <AdminDashboardChartCard title="Recent Moderation Activity">
                  <AdminDashboardActivityCh activities={stats.recentModerationActivity} />
                </AdminDashboardChartCard>

                <AdminDashboardChartCard title="Moderation Queue">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
                      <span className="text-sm text-[#d7def0]">Pending Recipes</span>
                      <strong className="text-white">{stats.pendingRecipes}</strong>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
                      <span className="text-sm text-[#d7def0]">Needs Revision</span>
                      <strong className="text-white">{stats.needsRevisionRecipes}</strong>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
                      <span className="text-sm text-[#d7def0]">Published Recipes</span>
                      <strong className="text-white">{stats.publishedRecipes}</strong>
                    </div>
                  </div>
                </AdminDashboardChartCard>
              </section>
            </div>
          )}
        {/* </div> */}
      {/* </main> */}
    </AdminLayout>
  )
}
