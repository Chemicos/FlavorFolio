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
      className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] flex-col overflow-hidden border-l border-white/10 bg-[#16181d] shadow-[-24px_0_80px_rgba(0,0,0,0.42)]"
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 z-50 h-full w-3 -translate-x-1/2 cursor-col-resize before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-white/10 hover:before:bg-orange-400/60"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative h-[250px] overflow-hidden bg-[#0b0b0c]">
          {user.bannerImage ? (
            <img
              src={user.bannerImage}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#242833] to-[#0b0b0c]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-[#16181d]/20 to-black/30" />

          <button
            type="button"
            onClick={onClose}
            className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#16181d]/90 text-[#a8b3cf] backdrop-blur-xl transition hover:bg-[#0b0b0c] hover:text-white"
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: 26 }} />
          </button>
        </div>

        <div className="relative z-10 -mt-14 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-10 pt-8">
          <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/70">
                {(user.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-xl border border-orange-400/15 bg-orange-500/10 px-3 py-2 text-xs font-semibold capitalize text-orange-200">
              {user.role}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white">
            {user.username}
          </h1>

          <p className="mt-1 text-sm text-[#8f97b1]">
            {fullName || user.email || "No public name"}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <InfoBox icon={<MenuBookRoundedIcon />} label="recipes" value={user.recipesCount} />
            <InfoBox icon={<PeopleAltRoundedIcon />} label="followers" value={user.followersCount} />
            <InfoBox icon={<BookmarkRoundedIcon />} label="saved" value={user.savedRecipesCount} />
          </div>

          <section className="mt-8">
            <h2 className="text-base font-bold text-white">Profile</h2>

            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Email" value={user.email || "-"} />
              <InfoRow label="Location" value={user.location || "-"} />
              <InfoRow label="Website" value={user.website || "-"} />
              <InfoRow label="Joined" value={formatDate(user.createdAtMs)} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-base font-bold text-white">Bio</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#8f97b1]">
              {user.bio || "No bio added."}
            </p>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#16181d]/95 px-6 py-4">
        <button
          type="button"
          onClick={() => navigate(`/users/${user.uid}`)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-orange-400/10 bg-orange-500/10 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/15 active:scale-[0.98]"
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
    <div className="rounded-xl border border-white/[0.10] bg-[#0b0b0c] px-4 py-5 text-center">
      <div className="flex justify-center text-white">{icon}</div>
      <p className="mt-3 text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-[#8f97b1]">{label}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-[#0b0b0c]/70 px-4 py-3">
      <span className="text-[#8f97b1]">{label}</span>
      <span className="truncate text-right font-medium text-[#d7def0]">
        {value}
      </span>
    </div>
  )
}
