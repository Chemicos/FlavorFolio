import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"

import { useNavigate } from "react-router-dom"
import { AdminUserRow } from "../types/adminUsers.types"
import { motion } from "motion/react"

interface AdminUsersDetailsDrawerProps {
    user: AdminUserRow
    width: number
    onClose: () => void
    onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void
}

function formatDate(ms: number) {
    if (!ms) return "-"

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
    }).format(new Date(ms))
}

export default function AdminUsersDetailsDrawer({
    user,
    width,
    onClose,
    onResizeStart,
}: AdminUsersDetailsDrawerProps) {
    const navigate = useNavigate()
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
      style={{ width }}
      className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--bg-secondary)] shadow-[var(--shadow-panel)] transition-colors"
    >
      <div
        onMouseDown={onResizeStart}
        className={[
          "absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize",
          "before:absolute before:left-1/2 before:top-0 before:h-full before:w-px",
          "before:bg-[var(--border)]",
          "hover:before:bg-[var(--accent-border)]",
        ].join(" ")}
      />

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
        <div className="relative h-[250px] overflow-hidden bg-[var(--bg-tertiary)]">
          {user.bannerImage ? (
            <img
              src={user.bannerImage}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[image:var(--profile-banner-fallback)]" />
          )}

          <div className="absolute inset-0" style={{ background: "var(--profile-banner-overlay)" }} />

          <button
            type="button"
            onClick={onClose}
            className={[
              "absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-lg border",
              "border-[var(--profile-floating-control-border)]",
              "bg-[var(--profile-floating-control-bg)]",
              "text-[var(--profile-floating-control-text)]",
              "backdrop-blur-xl transition",
              "hover:bg-[var(--profile-floating-control-hover)]",
              "active:scale-95",
            ].join(" ")}
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: 26 }} />
          </button>
        </div>

        <div className="relative z-10 -mt-14 rounded-t-[2.8rem] bg-[var(--bg-secondary)] px-7 pb-10 pt-8">
          <div className="h-24 w-24 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] shadow-[var(--shadow-card)]">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--text-secondary)]">
                {(user.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold capitalize text-[var(--accent-text)]">
              {user.role}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">
            {user.username}
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {fullName || user.email || "No public name"}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <InfoBox icon={<MenuBookRoundedIcon />} label="recipes" value={user.recipesCount} />
            <InfoBox icon={<PeopleAltRoundedIcon />} label="followers" value={user.followersCount} />
            <InfoBox icon={<BookmarkRoundedIcon />} label="saved" value={user.savedRecipesCount} />
          </div>

          <section className="mt-8">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Profile</h2>

            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Email" value={user.email || "-"} />
              <InfoRow label="Location" value={user.location || "-"} />
              <InfoRow label="Website" value={user.website || "-"} />
              <InfoRow label="Joined" value={formatDate(user.createdAtMs)} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Bio</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-muted)]">
              {user.bio || "No bio added."}
            </p>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--sticky-profile-bg)] px-6 py-4">
        <button
          type="button"
          onClick={() => navigate(`/users/${user.uid}`)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-text)] hover:bg-[var(--accent-soft-hover)] transition active:scale-[0.98]"
        >
          <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
          View public profile
        </button>
      </div>
    </motion.aside>
  )
}

function InfoBox({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: number
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-5 text-center">
      <div className="flex justify-center text-[var(--text-primary)]">{icon}</div>
      <p className="mt-3 text-lg font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-[var(--surface-subtle)] px-4 py-3">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="truncate text-right font-medium text-[var(--text-secondary)]">
        {value}
      </span>
    </div>
  )
}
