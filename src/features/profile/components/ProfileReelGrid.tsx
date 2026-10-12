import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded"
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import ShareRoundedIcon from "@mui/icons-material/ShareRounded"

import { Reel, ReelStatus } from "../../reels/types/reel.types"
import { useEffect, useRef, useState } from "react"
import { useDismissibleLayer } from "../../../hooks/useDismissibleLayer"
import { AnimatePresence, motion } from "motion/react"
import { createPortal } from "react-dom"
import { ProfileContentViewMode } from "./ProfileContentToolbar"

interface ProfileReelGridProps {
  reels: Reel[]
  viewMode: ProfileContentViewMode
  currentUserId?: string | null
  showStatus?: boolean
  onReelClick?: (reel: Reel) => void
  onReelEdit?: (reel: Reel) => void
  onReelDelete?: (reel: Reel) => void
  onReelShare?: (reel: Reel) => void
}

const statusConfig: Record<ReelStatus, {
  label: string
  className: string
  listClassName: string
}> = {
  published: {
    label: "Published",
    className: "border border-[var(--success-border)] bg-[var(--success)] text-[var(--text-on-accent)]",
    listClassName: "border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]",
  }, 
  pending: {
    label: "Pending",
    className: "border border-[var(--warning-border)] bg-[var(--warning)] text-[var(--text-on-accent)]",
    listClassName: "border border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]",
  },
  needs_revision: {
    label: "Needs Revision",
    className: "border border-[var(--danger-border)] bg-[var(--danger)] text-[var(--text-on-accent)]",
    listClassName: "border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]",
  }, 
  draft: {
    label: "Draft",
    className: "border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]",
    listClassName: "border border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text-secondary)]",
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

function ProfileReelActionsMenu({
  reel,
  currentUserId,
  buttonClassName,
  onEdit,
  onDelete,
  onShare,
}: {
  reel: Reel,
  currentUserId?: string | null
  onEdit?: (reel: Reel) => void
  buttonClassName: string
  onDelete?: (reel: Reel) => void
  onShare?: (reel: Reel) => void
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({top: 0, left: 0})

  useDismissibleLayer({
    isOpen,
    refs: [wrapperRef, menuRef],
    onDismiss: () => setIsOpen(false)
  })

  const isPublished = reel.status === "published"
  const canManageReel = reel.userId === currentUserId
  const editLabel = reel.status === "needs_revision" ? "Resolve revision" : "Edit reel"

  const updateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    setMenuPosition({
      top: rect.top - 8,
      left: rect.right,
    })
  }

  useEffect(() => {
    if (!isOpen) return

    updateMenuPosition()

    const handlePositionUpdate = () => updateMenuPosition()

    window.addEventListener("resize", handlePositionUpdate)
    window.addEventListener("scroll", handlePositionUpdate, true)

    return () => {
      window.removeEventListener("resize", handlePositionUpdate)
      window.removeEventListener("scroll", handlePositionUpdate, true)
    }
  }, [isOpen])

  const handleAction = (
    event: React.MouseEvent,
    action?: (reel: Reel) => void
  ) => {
    event.stopPropagation()
    action?.(reel)
    setIsOpen(false)
  }

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{opacity: 0, y: 6, scale: 0.96}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, y: 6, scale: 0.96}}
          transition={{duration: 0.16, ease: [0.22, 1, 0.36, 1]}}
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            transform: "translate(-100%, -100%)",
          }}
          className="z-[100] w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
          onClick={(event) => event.stopPropagation()}
        >
          {isPublished && (
            <button
              type="button"
              onClick={(event) => handleAction(event, onShare)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
            >
              <ShareRoundedIcon sx={{fontSize: 18}} />
              Share
            </button>
          )}

          {canManageReel && (
            <>
              <button
                type="button"
                onClick={(event) => handleAction(event, onEdit)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
              >
                <EditRoundedIcon sx={{fontSize: 18}} />
                {editLabel}
              </button>

              <button
                type="button"
                onClick={(event) => handleAction(event, onDelete)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--danger-text)] transition hover:bg-[var(--danger-soft-hover)]"
              >
                <DeleteOutlineRoundedIcon sx={{fontSize: 18}} />
                Delete reel
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Reel actions"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation()

          if (!isOpen) {
            updateMenuPosition()
          }

          setIsOpen((prev) => !prev)
        }}
        className={buttonClassName}
      >
        <MoreHorizRoundedIcon sx={{fontSize: 20}} />
      </button>

      {typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  )
}

function ProfileReelCard({
  reel,
  currentUserId,
  showStatus = true,
  onReelClick,
  onReelEdit,
  onReelDelete,
  onReelShare,
} : {
  reel: Reel
  currentUserId?: string | null
  showStatus?: boolean
  onReelClick?: (reel: Reel) => void
  onReelEdit?: (reel: Reel) => void
  onReelDelete?: (reel: Reel) => void
  onReelShare?: (reel: Reel) => void
}) {
  const status = statusConfig[reel.status]

  return (
    <article 
      onClick={() => onReelClick?.(reel)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)]"
    >
      <div className="relative aspect-[9/14] overflow-hidden bg-black">
        <video 
          src={reel.videoUrl} 
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10" />

        {showStatus && (
          <span 
            className={[
              "absolute left-3 top-3 z-10 rounded-md border px-2.5 py-1 text-[0.68rem] font-semibold backdrop-blur-md",
              status.className
            ].join(" ")}
          >
            {status.label}
          </span>
        )}

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

          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-white/75">
            <div className="flex items-center gap-4">
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

            <ProfileReelActionsMenu 
              reel={reel}
              currentUserId={currentUserId}
              onEdit={onReelEdit}
              onDelete={onReelDelete}
              onShare={onReelShare}
              buttonClassName="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ProfileReelGrid({
  reels,
  viewMode,
  currentUserId,
  showStatus = true,
  onReelClick,
  onReelEdit,
  onReelDelete,
  onReelShare,
}: ProfileReelGridProps) {
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

  if (viewMode === "list") {
    return (
      <section className="my-2 grid gap-2">
        {reels.map((reel) => (
          <ProfileReelListCard 
            key={reel.reelId}
            reel={reel}
            showStatus={showStatus}
            currentUserId={currentUserId}
            onReelClick={onReelClick}
            onReelEdit={onReelEdit}
            onReelDelete={onReelDelete}
            onReelShare={onReelShare}
          />
        ))}
      </section>
    )
  }
  return (
    <section className="my-2 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {reels.map((reel) => (
        <ProfileReelCard 
          key={reel.reelId}
          reel={reel}
          showStatus={showStatus}
          currentUserId={currentUserId}
          onReelClick={onReelClick}
          onReelEdit={onReelEdit}
          onReelDelete={onReelDelete}
          onReelShare={onReelShare}
        />
      ))}
    </section>
  )
}

function ProfileReelListCard ({
  reel,
  currentUserId,
  showStatus = true,
  onReelClick,
  onReelEdit,
  onReelDelete,
  onReelShare,
} : {
  reel: Reel
  currentUserId?: string | null
  showStatus?: boolean
  onReelClick?: (reel: Reel) => void
  onReelEdit?: (reel: Reel) => void
  onReelDelete?: (reel: Reel) => void
  onReelShare?: (reel: Reel) => void
}) {
  const status = statusConfig[reel.status]

  return (
    <article
      onClick={() => onReelClick?.(reel)}
      className="group flex items-center cursor-pointer gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--card-hover)]"
    >
      <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-black">
        <video
          src={reel.videoUrl}
          poster={reel.thumbnail || undefined}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition group-hover:opacity-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md">
            <PlayArrowRoundedIcon sx={{fontSize: 20}} />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {showStatus && (
              <span
                className={[
                  "inline-flex rounded-md border px-2.5 py-1 text-[0.7rem] font-semibold",
                  status.listClassName,
                ].join(" ")}
              >
                {status.label}
              </span>
            )}

            <h3 className={[
                "line-clamp-1 text-base font-semibold text-[var(--text-primary)]",
                showStatus ? "mt-3" : "mt-0",
              ].join(" ")}
            >
              {reel.title}
            </h3>

            <p className="mt-1 text-sm capitalize text-[var(--text-muted)]">
              {reel.meal} · {formatDuration(reel.duration)}
            </p>

            {reel.description && (
              <p className="mt-2 line-clamp-1 text-sm text-[var(--text-secondary)]">
                {reel.description}
              </p>
            )}
          </div>

          <ProfileReelActionsMenu
            reel={reel}
            currentUserId={currentUserId}
            onEdit={onReelEdit}
            onDelete={onReelDelete}
            onShare={onReelShare}
            buttonClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          />
        </div>

        <div className="flex items-center gap-5 text-sm">
          <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
            <FavoriteRoundedIcon sx={{fontSize: 17}} />
            {formatCompactNumber(reel.stats.likesCount)}
          </span>

          <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
            <ChatBubbleRoundedIcon sx={{fontSize: 16}} />
            {formatCompactNumber(reel.stats.commentsCount)}
          </span>

          <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
            <VisibilityRoundedIcon sx={{fontSize: 18}} />
            {formatCompactNumber(reel.stats.viewsCount)}
          </span>
        </div>
      </div>
    </article>
  )
}
