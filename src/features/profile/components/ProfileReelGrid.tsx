import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"

import { Reel, ReelStatus } from "../../reels/types/reel.types"

interface ProfileReelGridProps {
  reels: Reel[]
}

const statusConfig: Record<ReelStatus, {
  label: string
  className: string
}> = {
  published: {
    label: "Published",
    className: "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]"
  }, 
  pending: {
    label: "Pending",
    className: "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]"
  },
  needs_revision: {
    label: "Needs Revision",
    className: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]"
  }, 
  draft: {
    label: "Draft",
    className: "border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
  }
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDuration(seconds: number) {
  const totalSeconds = Math.round(seconds || 0)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function ProfileReelCard({reel}: {reel: Reel}) {
  const status = statusConfig[reel.status]

  return (
    <article className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)]">
      <div className="relative aspect-[9/14] overflow-hidden bg-black">
        <video 
          src={reel.videoUrl} 
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10" />

        <span 
          className={[
            "absolute left-3 top-3 z-10 rounded-md border px-2.5 py-1 text-[0.68rem] font-semibold backdrop-blur-md",
            status.className
          ].join(" ")}
        >
          {status.label}
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
          }}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
          aria-label="Reel options"
        >
          <MoreHorizRoundedIcon sx={{fontSize: 20}} />
        </button>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md">
            <PlayArrowRoundedIcon sx={{fontSize: 24}} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-5 text-white">
            {reel.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs capitalize text-white/70">
            <span>{reel.meal}</span>
            <span>•</span>
            <span>{formatDuration(reel.duration)}</span>
          </div>

          <div className="mt-3 flex items-center gap-4 border-t border-white/15 pt-3 text-xs text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <FavoriteRoundedIcon sx={{fontSize: 16}} />
              {formatCompactNumber(reel.stats.likesCount)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <ChatBubbleRoundedIcon sx={{fontSize: 15}} />
              {formatCompactNumber(reel.stats.commentsCount)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <VisibilityRoundedIcon sx={{fontSize: 17}} />
              {formatCompactNumber(reel.stats.viewsCount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ProfileReelGrid({reels}: ProfileReelGridProps) {
  if (!reels.length) {
    return (
      <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)]">
          <PlayArrowRoundedIcon sx={{fontSize: 30}} />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
          No reels found
        </h3>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Reels matching this section will appear here.
        </p>
      </div>
    )
  }
  return (
    <section className="my-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {reels.map((reel) => (
        <ProfileReelCard 
          key={reel.reelId}
          reel={reel}
        />
      ))}
    </section>
  )
}
