
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
        {isRefreshing ? "Syncing data" : formatLastUpdated(lastUpdatedAt)}
      </p>
    </div>
  )
}
