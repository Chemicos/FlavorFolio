import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import LocalDiningRoundedIcon from "@mui/icons-material/LocalDiningRounded"
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded"
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded"
import YardRoundedIcon from "@mui/icons-material/YardRounded"
import ForestRoundedIcon from "@mui/icons-material/ForestRounded"

import { useAdminReportsSeasonal } from "../hooks/useAdminReportsSeasonal"
import AdminDashboardChartCard from "./AdminDashboardChartCard"
import { ReportsListSkeleton } from "./skeletons/AdminReportsSkeletons"

interface AdminReportsSeasonalSectionProps {
  refreshKey?: number
}

function getSeasonIcon(season: string) {
  if (season === "Winter") return <AcUnitRoundedIcon sx={{ fontSize: 20 }} />
  if (season === "Spring") return <YardRoundedIcon sx={{ fontSize: 20 }} />
  if (season === "Summer") return <WbSunnyRoundedIcon sx={{ fontSize: 20 }} />
  return <ForestRoundedIcon sx={{ fontSize: 20 }} />
}

export default function AdminReportsSeasonalSection({
  refreshKey = 0,
}: AdminReportsSeasonalSectionProps) {
  const { seasonal, isLoading, error } = useAdminReportsSeasonal(refreshKey)

  if (isLoading) {
    return (
      <div className="mt-8 space-y-6">
        <ReportsListSkeleton rows={12} />

        <section className="grid gap-6 xl:grid-cols-2">
          <ReportsListSkeleton rows={5} />
          <ReportsListSkeleton rows={5} />
          <ReportsListSkeleton rows={5} />
          <ReportsListSkeleton rows={5} />
        </section>
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

  if (!seasonal) return null

  return (
    <div className="mt-8 space-y-6">
      <AdminDashboardChartCard title="Top Ingredient by Month">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {seasonal.topIngredientByMonth.map((item) => (
            <div
              key={item.month}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 transition hover:bg-[var(--surface-hover)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.month}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {item.ingredient}
                  </p>
                </div>
              </div>

              <span className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-text)]">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </AdminDashboardChartCard>

      <section className="grid gap-6 xl:grid-cols-2">
        {seasonal.seasonalGroups.map((group) => (
          <AdminDashboardChartCard
            key={group.season}
            title={`${group.season} Ingredient Trends`}
          >
            <div className="space-y-3">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  {getSeasonIcon(group.season)}
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {group.season}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Most recurring ingredients in this season.
                  </p>
                </div>
              </div>

              {group.ingredients.length ? (
                group.ingredients.map((item, index) => (
                  <div
                    key={`${group.season}-${item.ingredient}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 text-sm text-[var(--text-muted)]">
                        {index + 1}
                      </span>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--accent)]">
                        <LocalDiningRoundedIcon sx={{ fontSize: 18 }} />
                      </div>

                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {item.ingredient}
                      </p>
                    </div>

                    <span className="text-sm font-bold text-[var(--accent-text)]">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-muted)]">
                  No seasonal ingredient data yet.
                </p>
              )}
            </div>
          </AdminDashboardChartCard>
        ))}
      </section>
    </div>
  )
}