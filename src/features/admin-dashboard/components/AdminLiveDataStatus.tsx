
interface AdminLiveDataStatusProps {
  isRefreshing: boolean
  lastUpdatedAt: Date | null
}

function formatLastUpdated(date: Date | null) {
  if (!date) return "Waiting for data"

  return `Last updated: ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`
}

export default function AdminLiveDataStatus({
    isRefreshing,
    lastUpdatedAt,
}: AdminLiveDataStatusProps) {
  return (
    <div 
      className={[
        "hidden rounded-xl border border-[var(--border)]",
        "bg-[var(--surface-subtle)] px-4 py-2 text-right",
        "shadow-[var(--shadow-card)] lg:block",
      ].join(" ")}
    >
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
        {isRefreshing ? "Syncing data" : formatLastUpdated(lastUpdatedAt)}
      </p>
    </div>
  )
}
