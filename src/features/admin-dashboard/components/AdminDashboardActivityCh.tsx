import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import CancelRoundedIcon from "@mui/icons-material/CancelRounded"
import { AdminDashboardModerationActivity } from "../types/adminDashboard.types"

function formatRelativeTime(ms: number) {
  if (!ms) return "now"

  const diffMinutes = Math.max(0, Math.floor((Date.now() - ms) / 60000))

  if (diffMinutes < 1) return "now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}


export default function AdminDashboardActivityCh({
  activities,
}: {
  activities: AdminDashboardModerationActivity[]
}) {
  if (!activities.length) {
    return (
      <p className="rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-muted)]">
        No moderation activity yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((item) => {
        const isApproved = item.type === "approved"
        const isResubmitted = item.type === "resubmitted"

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl bg-[var(--surface-subtle)] p-3 transition hover:bg-[var(--surface-hover)]"
          >
            <div
                className={
                    isApproved
                    ? "text-[var(--success)]"
                    : isResubmitted
                        ? "text-[var(--accent)]"
                        : "text-[var(--warning)]"
                }
            >
                {isApproved ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
                ) : isResubmitted ? (
                    <SendRoundedIcon sx={{ fontSize: 20 }} />
                ) : (
                    <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
                )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--text-primary)]">
                {isApproved
                ? "Recipe approved"
                : isResubmitted
                    ? "Recipe resubmitted"
                    : "Recipe needs revision"
                }
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {item.recipeTitle} · by {item.adminUsername}
              </p>
            </div>

            <span className="text-xs text-[var(--text-muted)]">
              {formatRelativeTime(item.createdAtMs)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
