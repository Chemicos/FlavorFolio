import { Skeleton } from "@mui/material"

const sx = { bgcolor: "var(--skeleton)" }
const subtleSx = { bgcolor: "var(--skeleton-subtle)" }

export function ReportsMetricSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
      <Skeleton width={90} height={18} sx={sx} />
      <Skeleton width={52} height={34} sx={{ ...sx, mt: 1 }} />
      <Skeleton width={120} height={16} sx={{ ...subtleSx, mt: 2 }} />
    </div>
  )
}

export function ReportsChartSkeleton({ height = 340 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
      <Skeleton width={180} height={22} sx={sx} />
      <div className="mt-6 space-y-4" style={{ height }}>
        <Skeleton variant="rounded" height="100%" sx={{ ...sx, borderRadius: "16px" }} />
      </div>
    </div>
  )
}

export function ReportsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
      <Skeleton width={180} height={22} sx={sx} />

      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-xl bg-[var(--surface-subtle)] p-4">
            <Skeleton width="65%" height={18} sx={sx} />
            <Skeleton width="38%" height={14} sx={{ ...subtleSx, mt: 0.7 }} />
          </div>
        ))}
      </div>
    </div>
  )
}