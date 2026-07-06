import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded"
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded"
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded"
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded"
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded"
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
        "fixed left-0 top-16 z-30 hidden h-[calc(100vh-64px)] border-r border-white/10 bg-[#0d0e11]/95 px-3 py-6 backdrop-blur-xl transition-all duration-300 xl:block",
        isCollapsed ? "w-[82px]" : "w-[260px]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-6 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#16181d] text-[#a8b3cf] shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-[#202329] hover:text-white"
        aria-label="Toggle admin sidebar"
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
            <h2 className="mt-2 text-lg font-bold text-white">Control Center</h2>
            <p className="mt-1 text-xs text-[#7f89a6]">
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
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                "flex h-11 items-center rounded-xl text-sm font-semibold transition",
                isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                isActive
                  ? "border border-[#feaa2b]/25 bg-[#feaa2b]/10 text-[#ffd28a]"
                  : "text-[#a8b3cf] hover:bg-white/[0.04] hover:text-white",
              ].join(" ")
            }
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
              {item.icon}
            </span>

            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
