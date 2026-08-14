import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"

import { NavLink } from "react-router-dom"

const items = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardRoundedIcon sx={{ fontSize: 19 }} /> },
  { label: "Recipes", to: "/admin/recipes", icon: <RestaurantMenuRoundedIcon sx={{ fontSize: 19 }} /> },
  { label: "Users", to: "/admin/users", icon: <PeopleAltRoundedIcon sx={{ fontSize: 19 }} /> },
  // { label: "Moderation", to: "/admin/pending-recipes", icon: <FactCheckRoundedIcon sx={{ fontSize: 19 }} /> },
  { label: "Reports", to: "/admin/reports", icon: <AssessmentRoundedIcon sx={{ fontSize: 19 }} /> },
]

interface AdminDashboardSidebarProps {
  isCollapsed: boolean
  onToggleCollapsed: () => void
}

export default function AdminDashboardSidebar({
  isCollapsed,
  onToggleCollapsed,
}: AdminDashboardSidebarProps) {
  return (
    <aside
      className={[
        "fixed left-0 top-16 z-30 hidden h-[calc(100vh-64px)]",
        "border-r border-[var(--border)] bg-[var(--bg-secondary)]",
        "px-3 py-6",
        "transition-[width,background-color,border-color] duration-300 xl:block",
        isCollapsed ? "w-[82px]" : "w-[260px]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Toggle admin sidebar"
        className={[
          "absolute -right-3 top-6 flex h-7 w-7 items-center justify-center",
          "rounded-lg border border-[var(--border)]",
          "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
          "shadow-[var(--shadow-card)] transition",
          "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
          "active:scale-95",
        ].join(" ")}
      >
        {isCollapsed ? (
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        ) : (
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        )}
      </button>

      <div className={["mb-8 px-2", isCollapsed ? "text-center" : ""].join(" ")}>
        {!isCollapsed && (
          <>
            <h2 className="mt-2 text-lg font-bold text-[var(--text-primary)]">Control Center</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Manage platform activity.
            </p>
          </>
        )}
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            replace
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                "flex h-11 items-center rounded-xl border text-sm font-semibold",
                "transition-[background-color,border-color,color,transform]",
                "active:scale-[0.98]",
                isCollapsed
                  ? "justify-center px-0"
                  : "gap-3 px-3",
                isActive
                  ? [
                      "border-[var(--accent-border)]",
                      "bg-[var(--accent-soft)]",
                      "text-[var(--accent-text)]",
                    ].join(" ")
                  : [
                      "border-transparent",
                      "text-[var(--text-secondary)]",
                      "hover:bg-[var(--surface-hover)]",
                      "hover:text-[var(--text-primary)]",
                    ].join(" "),
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    "transition-colors",
                    isActive
                      ? "bg-[var(--accent-soft-hover)]"
                      : "bg-[var(--surface-subtle)]",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                {!isCollapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
