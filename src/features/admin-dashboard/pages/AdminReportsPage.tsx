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
    const { isLoading, error, refetch } = useAdminReportsOverview()

    const { overview } = useAdminReportsOverview(reportsRefreshKey)
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
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Reports Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#8f97b1]">
            Analyze platform activity, food trends and recipe performance.
          </p>
        </div>


        <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-right lg:block">
                <div className="flex items-center justify-end gap-2">
                    <span
                    className={[
                        "h-2 w-2 rounded-full",
                        isRefreshing ? "bg-[#feaa2b]" : "bg-emerald-400",
                    ].join(" ")}
                    />
                    <p className="text-xs font-semibold text-[#d7def0]">
                    {isRefreshing ? "Refreshing..." : "Live data"}
                    </p>
                </div>

                <p className="mt-1 text-[0.7rem] text-[#8f97b1]">
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
                className="self-start rounded-lg border border-white/10 bg-white/[0.04] p-[5px] text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
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
            <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
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
                            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] p-2 text-left transition hover:bg-white/[0.06] active:scale-[0.99]"
                        >
                            <span className="w-5 text-sm text-[#a8b3cf]">
                                {index + 1}
                            </span>

                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/10">
                                {recipe.image ? (
                                <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    className="h-full w-full object-cover"
                                />
                                ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/60">
                                    {recipe.title.charAt(0).toUpperCase()}
                                </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                {recipe.title}
                                </p>
                                <p className="truncate text-xs text-[#8f97b1]">
                                by {recipe.authorUsername}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 text-sm font-semibold text-[#feaa2b]">
                                {recipe.savesCount}
                                <BookmarkRoundedIcon sx={{ fontSize: 17 }} />
                            </div>
                        </button>
                    ))}

                    {!overview.topSavedRecipes.length && (
                        <p className="py-8 text-center text-sm text-[#8f97b1]">
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
                            className="flex w-full gap-3 rounded-xl border border-white/10 bg-[#0b0b0c]/60 p-4 text-left transition hover:border-orange-400/30 hover:bg-orange-500/[0.04] disabled:cursor-default disabled:hover:border-white/10 disabled:hover:bg-[#0b0b0c]/60"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#feaa2b]/10 text-[#feaa2b]">
                                {index === 0 ? (
                                <InsightsRoundedIcon />
                                ) : index === 1 ? (
                                <LocalDiningRoundedIcon />
                                ) : (
                                <CalendarMonthRoundedIcon />
                                )}
                            </div>

                            <p className="text-sm leading-6 text-[#d7def0]">
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