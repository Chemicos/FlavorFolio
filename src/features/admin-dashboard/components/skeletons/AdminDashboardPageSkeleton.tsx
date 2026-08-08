import { Skeleton } from "@mui/material"

const skeletonSx = {
  bgcolor: "var(--surface-muted)",
}

const cardClassName = [
  "rounded-2xl border border-[var(--border)]",
  "bg-[var(--card-bg)] p-5",
  "shadow-[var(--shadow-card)]",
].join(" ")

function MetricSkeleton() {
  return (
    <div className={cardClassName}>
      <div className="flex items-start justify-between">
        <div>
          <Skeleton width={96} height={18} sx={skeletonSx} />
          <Skeleton width={72} height={34} sx={{ ...skeletonSx, mt: 1 }} />
          <Skeleton width={120} height={16} sx={{ ...skeletonSx, mt: 2 }} />
        </div>

        <Skeleton
          variant="rounded"
          width={42}
          height={42}
          sx={{ ...skeletonSx, borderRadius: "12px" }}
        />
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className={cardClassName}>
      <Skeleton width={180} height={24} sx={skeletonSx} />

      <div className="mt-6 h-[220px]">
        <Skeleton
          variant="rounded"
          width="100%"
          height="100%"
          sx={{ ...skeletonSx, borderRadius: "18px" }}
        />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className={cardClassName}>
      <Skeleton width={170} height={24} sx={skeletonSx} />

      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            width="100%"
            height={56}
            sx={{ ...skeletonSx, borderRadius: "14px" }}
          />
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPageSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.05fr_1.2fr]">
        <ChartSkeleton />
        <ChartSkeleton />
      </section>

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <ListSkeleton />
        <ListSkeleton />
        <ListSkeleton />
      </section>
    </div>
  )
}
