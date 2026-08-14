import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
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
        <div className="relative h-[190px] overflow-hidden bg-[var(--bg-tertiary)]">
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
              "absolute left-5 top-5 z-20",
              "flex h-11 w-11 items-center justify-center rounded-lg border",
              "border-[var(--drawer-control-border)]",
              "bg-[var(--drawer-control-bg)]",
              "text-[var(--text-secondary)]",
              "shadow-[var(--shadow-card)]",
              "transition",
              "hover:bg-[var(--drawer-control-hover)]",
              "hover:text-[var(--text-primary)]",
              "active:scale-95",
            ].join(" ")}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: 26 }} />
          </button>
        </div>

        <div className="relative z-10 -mt-10 rounded-t-[2.4rem] bg-[var(--bg-secondary)] px-7 pb-10 pt-6">
          <div className="flex items-end gap-4">
            <div
              className={[
                "h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4",
                "border-[var(--bg-secondary)]",
                "bg-[var(--surface-muted)]",
                "shadow-[var(--shadow-card)]",
              ].join(" ")}
            >
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

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-[var(--text-primary)]">
                  {user.username}
                </h1>

                <span
                  className={[
                    "rounded-lg border px-2 py-1 text-[11px] font-semibold capitalize",
                    user.role === "admin"
                      ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                      : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
                  ].join(" ")}
                >
                  {user.role}
                </span>
              </div>

              <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                {fullName || "No public name"}
              </p>

              <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                {user.email || "No email"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox icon={<MenuBookRoundedIcon />} label="recipes" value={user.recipesCount} />
            <InfoBox icon={<PeopleAltRoundedIcon />} label="followers" value={user.followersCount} />
            <InfoBox icon={<PeopleAltRoundedIcon />} label="Following" value={user.followingCount} />
            <InfoBox icon={<BookmarkRoundedIcon />} label="saved" value={user.savedRecipesCount} />
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Account details
            </h2>

            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <InfoRow label="Email" value={user.email || "-"} />
              <InfoRow label="Location" value={user.location || "-"} />
              <InfoRow label="Website" value={user.website || "-"} />
              <InfoRow label="Joined" value={formatDate(user.createdAtMs)} />
              <InfoRow label="User ID" value={user.uid} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Bio</h2>
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
                  {user.bio || "No bio added."}
                </p>
              </div>
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
    <div
      className={[
        "rounded-xl border px-3 py-4 text-center",
        "border-[var(--border)]",
        "bg-[var(--surface-subtle)]",
        "transition hover:bg-[var(--surface-hover)]",
      ].join(" ")}
    >
      <div className="flex justify-center text-[var(--accent)]">
        {icon}
      </div>

      <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-5 px-4 py-3.5",
        "border-b border-[var(--border-subtle)] last:border-b-0",
      ].join(" ")}
    >
      <span className="shrink-0 text-xs font-medium text-[var(--text-muted)]">
        {label}
      </span>

      <span
        className="min-w-0 truncate text-right text-sm font-medium text-[var(--text-secondary)]"
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
