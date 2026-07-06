import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded"
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"

import { AccountSettingsTab } from "./AccountSettingsLayout"
import { useNavigate } from "react-router-dom"


interface AccountSettingsSidebarProps {
  activeTab: AccountSettingsTab
  onTabChange: (tab: AccountSettingsTab) => void
}

const sidebarItems: Array<{
  value: AccountSettingsTab
  label: string
  icon: typeof SecurityRoundedIcon
}> = [
  {
    value: "security",
    label: "Security",
    icon: SecurityRoundedIcon,
  },
  {
    value: "blocked",
    label: "Blocked",
    icon: BlockRoundedIcon,
  },
  {
    value: "privacy",
    label: "Privacy",
    icon: VisibilityRoundedIcon,
  },
  {
    value: "notifications",
    label: "Notifications",
    icon: NotificationsRoundedIcon,
  },
]

export default function AccountSettingsSidebar({
  activeTab,
  onTabChange,
}: AccountSettingsSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="sticky top-28 h-fit overflow-hidden rounded-2xl border border-white/10 bg-[#16181d]/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-4 px-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#a8b3cf] transition hover:bg-white/[0.08] hover:text-white active:scale-95"
          aria-label="Go back"
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-white">Account Settings</h1>
          <p className="mt-1 text-xs text-[#7f89a6]">
            Manage your account preferences.
          </p>
        </div>
      </div>

      <nav className="mt-10 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.value

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTabChange(item.value)}
              className={[
                "group flex h-11 w-full items-center rounded-xl text-sm font-semibold transition",
                "gap-3 px-3 text-left",
                isActive
                  ? "border border-[#feaa2b]/25 bg-[#feaa2b]/10 text-[#ffd28a]"
                  : "border border-transparent text-[#a8b3cf] hover:bg-white/[0.04] hover:text-white",
              ].join(" ")}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <Icon sx={{ fontSize: 19 }} />
              </span>

              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-16 border-t border-white/10 pt-5">
        <button
          type="button"
          className="group flex h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-sm font-semibold text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            <LogoutRoundedIcon sx={{ fontSize: 19 }} />
          </span>

          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  )
}
