import ViewSidebarIcon from "@mui/icons-material/ViewSidebar"
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"

import { Checkbox, Tooltip } from "@mui/material"
import { AdminUserRow } from "../types/adminUsers.types"

interface AdminUsersTableRowProps {
    user: AdminUserRow
    isActive?: boolean
    onView: () => void
    isSelected: boolean
    onToggle: () => void
}

const viewTooltipProps = {
  tooltip: {
    sx: {
      bgcolor: "#0b0b0c",
      color: "#d7def0",
      fontSize: "0.75rem",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
      px: 1.2,
      py: 0.7,
    },
  },
  arrow: {
    sx: {
      color: "#0b0b0c",
      "&:before": {
        border: "1px solid rgba(255,255,255,0.08)",
      },
    },
  },
}

function formatDate(ms: number) {
    if (!ms) return "-"

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(new Date(ms))
}

function getRoleClass(role: string) {
    if (role === "admin") {
        return "border-orange-400/20 bg-orange-500/10 text-orange-200"
    }

    return "border-sky-400/20 bg-sky-500/10 text-sky-300"
}

export default function AdminUsersTableRow({
    user,
    isActive = false,
    onView,
    isSelected = false,
    onToggle,
}: AdminUsersTableRowProps) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")

    const cellClassName = [
        "px-4 py-3 transition-colors",
        isActive
            ? "bg-[#202636]"
            : isSelected
            ? "bg-[#161b24]"
            : "bg-[#0b0b0c] group-hover:bg-[#202429]",
    ].join(" ")

  return (
    <tr className="group transition-all">
      <td className={`${cellClassName} rounded-l-lg`}>
        <div className="flex min-w-0 items-center gap-3">
            <Checkbox
                checked={isSelected}
                onChange={onToggle}
                size="small"
                sx={{
                    padding: 0,
                    color: "rgba(168,179,207,0.75)",
                    "&.Mui-checked": { color: "#a8b3cf" },
                    "& .MuiSvgIcon-root": { fontSize: 22 },
                }}
            />

          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                {(user.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.username}
            </p>
            <p className="truncate text-xs text-[#8f97b1]">
              {fullName || user.email || "No profile details"}
            </p>
          </div>
        </div>
      </td>

      <td className={cellClassName}>
        <span
          className={[
            "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
            getRoleClass(user.role),
          ].join(" ")}
        >
          {user.role}
        </span>
      </td>

      <td className={cellClassName}>
        <div className="flex items-center gap-3 text-sm text-[#a8b3cf]">
          <span className="inline-flex items-center gap-1 text-[#feaa2b]">
            <MenuBookRoundedIcon sx={{ fontSize: 16 }} />
            {user.recipesCount}
          </span>

          <span className="inline-flex items-center gap-1">
            <PeopleAltRoundedIcon sx={{ fontSize: 16 }} />
            {user.followersCount}
          </span>

          <span className="inline-flex items-center gap-1 text-[#feaa2b]">
            <BookmarkRoundedIcon sx={{ fontSize: 16 }} />
            {user.savedRecipesCount}
          </span>
        </div>
      </td>

      <td className={cellClassName}>
        <span className="text-sm text-[#a8b3cf]">
          {user.location || "-"}
        </span>
      </td>

      <td className={cellClassName}>
        <span className="text-sm text-[#8f97b1]">
          {formatDate(user.createdAtMs)}
        </span>
      </td>

      <td className={`${cellClassName} rounded-r-xl text-right`}>
        <Tooltip 
            title="View user"
            arrow
            placement="top"
            slotProps={viewTooltipProps}
        >
          <button
            type="button"
            onClick={onView}
            className="inline-flex translate-x-3 items-center justify-center text-[#a8b3cf] opacity-0 transition-all duration-200 ease-out hover:text-white active:scale-95 group-hover:translate-x-0 group-hover:opacity-100"
          >
            <ViewSidebarIcon sx={{ fontSize: 24 }} />
          </button>
        </Tooltip>
      </td>
    </tr>
  )
}
