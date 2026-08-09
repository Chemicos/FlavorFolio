import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded"
import PersonRoundedIcon from "@mui/icons-material/PersonRounded"
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded"
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { useMemo, useState } from "react"
import { useAdminUsers } from "../hooks/useAdminUsers"
import { AdminUserRow } from "../types/adminUsers.types"
import { AnimatePresence } from "motion/react"

import AdminLayout from "../components/AdminLayout"
import AdminUsersDetailsDrawer from "../components/AdminUsersDetailsDrawer"
import AdminUsersTable from "../components/AdminUsersTable"
import AdminUsersPageSkeleton from "../components/skeletons/AdminUsersPageSkeleton"
import DeleteWarningDialog from "../../home/components/recipe-view-drawer/DeleteWarningDialog"
import { useAdminLiveRefresh } from "../hooks/useAdminLiveRefresh"
import AdminLiveDataStatus from "../components/AdminLiveDataStatus"

function isUserCreatedThisMonth(createdAtMs: number) {
  if (!createdAtMs) return false

  const now = new Date()
  const createdAt = new Date(createdAtMs)

  return (
    createdAt.getFullYear() === now.getFullYear() &&
    createdAt.getMonth() === now.getMonth()
  )
}

export default function AdminUsersPage() {
    const { users, isLoading, isDeleting, error, refetch, deleteUsers } = useAdminUsers()

    const [search, setSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const { isRefreshing, lastUpdatedAt, handleRefresh } = useAdminLiveRefresh({
      isLoading,
      hasData: users.length > 0,
      onRefresh: refetch,
    })

    const [detailsDrawerWidth, setDetailsDrawerWidth] = useState(540)

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase()

        if (!query) return users

        return users.filter((user) =>
        [
            user.username,
            user.email,
            user.firstName,
            user.lastName,
            user.role,
            user.location,
        ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
    }, [users, search])

    const adminCount = users.filter((user) => user.role === "admin").length
    const memberCount = users.filter((user) => user.role === "member").length
    const newUsersThisMonthCount = users.filter((user) =>
        isUserCreatedThisMonth(user.createdAtMs)
    ).length

    const handleDetailsResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()

        const startX = event.clientX
        const startWidth = detailsDrawerWidth

        const handleMouseMove = (moveEvent: MouseEvent) => {
        setDetailsDrawerWidth(
            Math.min(760, Math.max(430, startWidth + startX - moveEvent.clientX))
        )
        }

        const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }

    const handleToggleUser = (userId: string) => {
        setSelectedIds((prev) =>
            prev.includes(userId)
            ? prev.filter((id) => id !== userId)
            : [...prev, userId]
        )
    }

    const handleConfirmDelete = async () => {
        await deleteUsers(selectedIds)

        if (selectedUser && selectedIds.includes(selectedUser.uid)) {
            setSelectedUser(null)
        }

        setSelectedIds([])
        setIsDeleteDialogOpen(false)
    }
  return (
    <AdminLayout
      fullHeight
      rightOffset={selectedUser ? detailsDrawerWidth : 0}
    >
      <header className="flex shrink-0 flex-col gap-5 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Users
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Manage and inspect FlavorFolio user profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AdminLiveDataStatus
            isRefreshing={isRefreshing}
            lastUpdatedAt={lastUpdatedAt}
          />

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={[
              "self-start rounded-lg border p-[5px] transition lg:self-auto",
              "border-[var(--button-secondary-border)]",
              "bg-[var(--button-secondary-bg)]",
              "text-[var(--button-secondary-text)]",
              "hover:bg-[var(--button-secondary-hover)]",
              "hover:text-[var(--text-primary)]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            <RefreshRoundedIcon
              sx={{ fontSize: 26 }}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </header>

      {isLoading ? (
        <AdminUsersPageSkeleton />
      ): (
        <>
            <section className="mt-5 grid shrink-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total Users"
                  value={users.length}
                  helper="Registered accounts"
                  icon={<PeopleAltRoundedIcon />}
                />

                <MetricCard
                  label="Admins"
                  value={adminCount}
                  helper="Platform managers"
                  icon={<AdminPanelSettingsRoundedIcon />}
                />

                <MetricCard
                  label="Members"
                  value={memberCount}
                  helper="Regular users"
                  icon={<PersonRoundedIcon />}
                />

                <MetricCard
                  label="New Users"
                  value={newUsersThisMonthCount}
                  helper="Joined this month"
                  icon={<PersonAddAltRoundedIcon />}
                />
            </section>

            <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="mb-5 flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">User Directory</h2>

                    <div className="relative w-full md:w-[360px]">
                        <SearchRoundedIcon
                          sx={{ fontSize: 18 }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />

                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search users, email, role..."
                          className={[
                            "h-11 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition",
                            "border-[var(--input-border)]",
                            "bg-[var(--input-bg)]",
                            "text-[var(--text-primary)]",
                            "placeholder:text-[var(--input-placeholder)]",
                            "hover:border-[var(--border-strong)]",
                            "hover:bg-[var(--input-bg-hover)]",
                            "focus:border-[var(--focus-border)]",
                            "focus:ring-2 focus:ring-[var(--focus-ring)]",
                          ].join(" ")}
                        />
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div
                      className= "mb-5 flex flex-wrap items-center justify-between gap-3"
                    >
                        <div className="flex items-center">
                        <p className="text-sm text-[var(--text-muted)]">
                            {selectedIds.length}{" "}
                            {selectedIds.length === 1 ? "user" : "users"} selected
                        </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIds([])}
                          className={[
                            "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                            "border-[var(--button-secondary-border)]",
                            "bg-[var(--button-secondary-bg)]",
                            "text-[var(--button-secondary-text)]",
                            "hover:bg-[var(--button-secondary-hover)]",
                            "hover:text-[var(--text-primary)]",
                          ].join(" ")}
                        >
                          <CloseRoundedIcon sx={{ fontSize: 18 }} />
                          Clear
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className={[
                              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                              "border-[var(--danger-border)]",
                              "bg-[var(--danger-soft)]",
                              "text-[var(--danger-text)]",
                              "hover:bg-[var(--danger-soft-hover)]",
                            ].join(" ")}
                        >
                            <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                            Delete selected
                        </button>
                        </div>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
                    <AdminUsersTable
                    users={filteredUsers}
                    selectedIds={selectedIds}
                    activeUserId={selectedUser?.uid || null}
                    onToggleUser={handleToggleUser}
                    onViewUser={setSelectedUser}
                    />
                </div>
            </section>
        </>
      )}

      <AnimatePresence>
        {selectedUser && (
          <AdminUsersDetailsDrawer
            key={selectedUser.uid}
            user={selectedUser}
            width={detailsDrawerWidth}
            onClose={() => setSelectedUser(null)}
            onResizeStart={handleDetailsResizeStart}
          />
        )}
      </AnimatePresence>

      <DeleteWarningDialog
        isOpen={isDeleteDialogOpen}
        isDeleting={isDeleting}
        title={
            selectedIds.length === 1
            ? "Delete user?"
            : `Delete ${selectedIds.length} users?`
        }
        description="This will delete the user profile, created recipes, saved recipes, follow links, notifications, comment reactions, comments and related images."
        confirmLabel="Delete"
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
       />
    </AdminLayout>
  )
}

function MetricCard({
    label,
    value,
    helper,
    icon,
}: {
    label: string
    value: number
    helper: string
    icon: React.ReactNode
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5",
        "border-[var(--border)]",
        "bg-[var(--card-bg)]",
        "shadow-[var(--shadow-card)]",
        "transition-colors",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</h2>
          <p className="mt-4 text-xs font-medium text-[var(--success-text)]">{helper}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon}
        </div>
      </div>
    </div>
  )
}
