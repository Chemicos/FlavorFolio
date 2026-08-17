import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"

import { AdminUserRow } from "../types/adminUsers.types"
import AdminUsersTableRow from "./AdminUsersTableRow"
import { useMemo, useState } from "react"

type AdminUsersSortKey =
    | "user"
    | "role"
    | "stats"
    | "location"
    | "joined"

type SortDirection = "asc" | "desc"

interface AdminUsersTableProps {
    users: AdminUserRow[]
    activeUserId?: string | null
    onViewUser: (user: AdminUserRow) => void
    selectedIds: string[]
    onToggleUser: (userId: string) => void
}

interface AdminUsersColumn {
    key: AdminUsersSortKey | "actions"
    label: string
    sortable?: boolean
    className?: string
}

const columns: AdminUsersColumn[] = [
    { key: "user", label: "User", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "stats", label: "Stats", sortable: true },
    { key: "location", label: "Location", sortable: true },
    { key: "joined", label: "Joined", sortable: true },
    { key: "actions", label: "", className: "text-right" },
]

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" })
}

function getUserStatsTotal(user: AdminUserRow) {
  return user.recipesCount + user.followersCount + user.savedRecipesCount
}

function sortUsers(
  users: AdminUserRow[],
  sortKey: AdminUsersSortKey,
  direction: SortDirection
) {
  const modifier = direction === "asc" ? 1 : -1

  return [...users].sort((a, b) => {
    switch (sortKey) {
      case "user":
        return compareText(a.username, b.username) * modifier

      case "role":
        return compareText(a.role, b.role) * modifier

      case "stats":
        return (getUserStatsTotal(a) - getUserStatsTotal(b)) * modifier

      case "location":
        return compareText(a.location || "-", b.location || "-") * modifier

      case "joined":
        return (a.createdAtMs - b.createdAtMs) * modifier

      default:
        return 0
    }
  })
}

export default function AdminUsersTable({
    users,
    activeUserId,
    onViewUser,
    selectedIds,
    onToggleUser,  
}: AdminUsersTableProps) {
  const [sortKey, setSortKey] = useState<AdminUsersSortKey>("joined")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const sortedUsers = useMemo(() => {
    return sortUsers(users, sortKey, sortDirection)
  }, [users, sortKey, sortDirection])

  const handleSort = (key: AdminUsersSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDirection(key === "joined" || key === "stats" ? "desc" : "asc")
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-[6px]">
          <thead className="sticky top-0 z-20 bg-[var(--bg-secondary)]">
            <tr className="text-left text-sm font-semibold text-[var(--text-secondary)]">
              {columns.map((column) => {
                const isSortable = Boolean(column.sortable)
                const isActive = sortKey === column.key

                return (
                  <th
                    key={column.key}
                    className={[
                      "px-4 py-3",
                      column.className || "",
                    ].join(" ")}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key as AdminUsersSortKey)}
                        className={[
                          "inline-flex items-center gap-1 transition hover:text-[var(--text-primary)]",
                          isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                        ].join(" ")}
                      >
                        <span>{column.label}</span>

                        <KeyboardArrowDownRoundedIcon
                          sx={{ fontSize: 18 }}
                          className={[
                            "transition",
                            isActive ? "opacity-100" : "opacity-45",
                            isActive && sortDirection === "asc"
                              ? "rotate-180"
                              : "",
                          ].join(" ")}
                        />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {sortedUsers.map((user) => (
              <AdminUsersTableRow
                key={user.uid}
                user={user}
                isSelected={selectedIds.includes(user.uid)}
                isActive={activeUserId === user.uid}
                onToggle={() => onToggleUser(user.uid)}
                onView={() => onViewUser(user)}
              />
            ))}
          </tbody>
        </table>

        {!sortedUsers.length && (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
