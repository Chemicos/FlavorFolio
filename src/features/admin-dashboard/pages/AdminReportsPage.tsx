import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded"
import LocalDiningRoundedIcon from "@mui/icons-material/LocalDiningRounded"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"

import AdminLayout from "../components/AdminLayout"
import AdminDashboardMetricsCard from "../components/AdminDashboardMetricsCard"
import AdminDashboardChartCard from "../components/AdminDashboardChartCard"
import { useEffect, useState } from "react"
import AdminReportsTabs, { AdminReportTabValue } from "../components/AdminReportsTabs"
import { useAdminReportsOverview } from "../hooks/useAdminReportsOverview"
import { CircularProgress } from "@mui/material"
import { useNavigate } from "react-router-dom"
import AdminReportsCommunitySection from "../components/AdminReportsCommunitySection"
import AdminReportsFoodSection from "../components/AdminReportsFoodSection"
import AdminReportsSeasonalSection from "../components/AdminReportsSeasonalSection"
import { useAdminReportsCommunity } from "../hooks/useAdminReportsCommunity"
import { useAdminReportsFood } from "../hooks/useAdminReportsFood"
import { useAdminReportsSeasonal } from "../hooks/useAdminReportsSeasonal"
import { AdminReportsPdfExportMode, exportAdminReportsPdf } from "../services/adminReportsPdf.service"
import AdminReportsExportDropdown from "../components/AdminReportsExportDropdown"
import { getCurrentAdminDisplayName } from "../services/adminReports.service"
import { ReportsListSkeleton, ReportsMetricSkeleton } from "../components/skeletons/AdminReportsSkeletons"

function formatLastUpdated(date: Date | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function AdminReportsPage() {
    const navigate = useNavigate()
    const [reportsRefreshKey, setReportsRefreshKey] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

    const [activeTab, setActiveTab] = useState<AdminReportTabValue>("overview")
    // const {  } = useAdminReportsOverview()

    const { overview, isLoading, error, refetch } = useAdminReportsOverview(reportsRefreshKey)
    const { community } = useAdminReportsCommunity(reportsRefreshKey)
    const { food } = useAdminReportsFood(reportsRefreshKey)
    const { seasonal } = useAdminReportsSeasonal(reportsRefreshKey)

    const handleExportReport = async (mode: AdminReportsPdfExportMode) => {
        const adminName = await getCurrentAdminDisplayName()

        exportAdminReportsPdf({
            activeTab,
            exportMode: mode,
            adminName,
            overview,
            community,
            food,
            seasonal,
        })
    }

    const [highlightedFoodSection, setHighlightedFoodSection] =
        useState<"top-cuisines" | "top-ingredients" | "meal-types" | null>(null)

    useEffect(() => {
        if (!isLoading && overview && !lastUpdatedAt) {
            setLastUpdatedAt(new Date())
        }
    }, [isLoading, overview, lastUpdatedAt])

    const handleRefreshReports = async () => {
        try {
            setIsRefreshing(true)

            await refetch()
            setReportsRefreshKey((prev) => prev + 1)
            setLastUpdatedAt(new Date())
        } finally {
            window.setTimeout(() => {
            setIsRefreshing(false)
            }, 650)
        }
    }

    const handleInsightClick = (
        target?: "top-cuisines" | "top-ingredients" | "meal-types"
    ) => {
        if (!target) return

        setActiveTab("food")
        setHighlightedFoodSection(target)

        window.setTimeout(() => {
            setHighlightedFoodSection(null)
        }, 1800)
    }

  return (
     <AdminLayout>
      <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Reports Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Analyze platform activity, food trends and recipe performance.
          </p>
        </div>


        <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-right lg:block">
                <div className="flex items-center justify-end gap-2">
                    <span
                    className={[
                        "h-2 w-2 rounded-full",
                        isRefreshing ? "bg-[var(--accent)]" : "bg-[var(--success)]",
                    ].join(" ")}
                    />
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {isRefreshing ? "Refreshing..." : "Live data"}
                    </p>
                </div>

                <p className="mt-1 text-[0.7rem] text-[var(--text-muted)]">
                    {isRefreshing
                    ? "Syncing reports"
                    : lastUpdatedAt
                        ? `Last updated: ${formatLastUpdated(lastUpdatedAt)}`
                        : "Waiting for data"}
                </p>
            </div>
            
            <button
                type="button"
                onClick={handleRefreshReports}
                disabled={isRefreshing}
                className={[
                    "self-start rounded-lg border p-[5px] transition lg:self-auto",
                    "border-[var(--button-secondary-border)]",
                    "bg-[var(--button-secondary-bg)]",
                    "text-[var(--button-secondary-text)]",
                    "hover:bg-[var(--button-secondary-hover)]",
                    "hover:text-[var(--text-primary)]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
            >
                <RefreshRoundedIcon
                    sx={{ fontSize: 26 }}
                    className={isRefreshing ? "animate-spin" : ""}
                />
            </button>

            <AdminReportsExportDropdown onExport={handleExportReport} />
        </div>
      </header>

      <AdminReportsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <>
            {isLoading && (
            <div className="mt-8 space-y-6">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <ReportsMetricSkeleton key={index} />
                ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <ReportsListSkeleton rows={5} />
                <ReportsListSkeleton rows={4} />
                </section>
            </div>
            )}

            {!isLoading && error && (
            <div className="mt-8 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger-text)]">
                {error}
            </div>
            )}

            {!isLoading && overview && (
            <>
                <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AdminDashboardMetricsCard
                    label="Users"
                    value={String(overview.totalUsers)}
                    helper={`${overview.newUsers30d} new in 30 days`}
                    icon={<PeopleAltRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                    label="Recipes"
                    value={String(overview.totalRecipes)}
                    helper={`${overview.newRecipes30d} new in 30 days`}
                    icon={<RestaurantRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                    label="Comments"
                    value={String(overview.totalComments)}
                    helper="Community conversations"
                    icon={<ChatBubbleRoundedIcon />}
                />

                <AdminDashboardMetricsCard
                    label="Saved Recipes"
                    value={String(overview.totalSaves)}
                    helper={`${overview.publishedRecipesPercent.toFixed(1)}% published`}
                    icon={<BookmarkRoundedIcon />}
                />
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <AdminDashboardChartCard title="Most Saved Recipes">
                    <div className="space-y-3">
                    {overview.topSavedRecipes.map((recipe, index) => (
                        <button
                            key={recipe.recipeId}
                            type="button"
                            onClick={() => navigate(`/admin/recipes?recipeId=${recipe.recipeId}`)}
                            className="flex w-full items-center gap-3 rounded-xl bg-[var(--surface-subtle)] p-2 text-left transition hover:bg-[var(--surface-hover)] active:scale-[0.99]"
                        >
                            <span className="w-5 text-sm text-[var(--text-secondary)]">
                                {index + 1}
                            </span>

                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
                                {recipe.image ? (
                                <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    className="h-full w-full object-cover"
                                />
                                ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                                    {recipe.title.charAt(0).toUpperCase()}
                                </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                {recipe.title}
                                </p>
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                by {recipe.authorUsername}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 text-sm font-semibold text-[var(--accent-text)]">
                                {recipe.savesCount}
                                <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
                            </div>
                        </button>
                    ))}

                    {!overview.topSavedRecipes.length && (
                        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                        No saved recipes data yet.
                        </p>
                    )}
                    </div>
                </AdminDashboardChartCard>

                <AdminDashboardChartCard title="Flavor Insights">
                    <div className="space-y-3">
                    {overview.flavorInsights.map((insight, index) => (
                        <button 
                            key={insight.id}
                            type="button"
                            onClick={() => handleInsightClick(insight.target)}
                            disabled={!insight.target}
                            className="flex w-full gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] disabled:cursor-default disabled:hover:border-[var(--border)] disabled:hover:bg-[var(--surface-subtle)]"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                                {index === 0 ? (
                                <InsightsRoundedIcon />
                                ) : index === 1 ? (
                                <LocalDiningRoundedIcon />
                                ) : (
                                <CalendarMonthRoundedIcon />
                                )}
                            </div>

                            <p className="text-sm leading-6 text-[var(--text-secondary)]">
                                {insight.text}
                            </p>
                        </button>
                        
                    ))}
                    </div>
                </AdminDashboardChartCard>
                </section>
            </>
            )}
        </>
      )}    

      {activeTab === "community" && <AdminReportsCommunitySection refreshKey={reportsRefreshKey} />}

      {activeTab === "food" && (<AdminReportsFoodSection refreshKey={reportsRefreshKey} highlightedSection={highlightedFoodSection} />)}

      {activeTab === "seasonal" && (<AdminReportsSeasonalSection refreshKey={reportsRefreshKey} />)}
    </AdminLayout>
  )
}