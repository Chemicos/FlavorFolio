import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded"
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded"

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
    value: "preferences",
    label: "Preferences",
    icon: SettingsRoundedIcon,
  },
]

export default function AccountSettingsSidebar({
  activeTab,
  onTabChange,
}: AccountSettingsSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="sticky top-20 h-fit overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-[var(--shadow-panel)] transition-colors duration-200">
      <div className="flex items-center gap-4 px-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-95"
          aria-label="Go back"
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Account Settings</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
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
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                  : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                  isActive
                    ? "bg-[var(--accent-soft-hover)]"
                    : "bg-[var(--surface-subtle)] group-hover:bg-[var(--surface-hover)]",
                ].join(" ")}
              >
                <Icon sx={{ fontSize: 19 }} />
              </span>

              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-16 border-t border-[var(--border)] pt-5">
        <button
          type="button"
          className="group flex h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-subtle)] transition group-hover:bg-[var(--danger-soft)]">
            <LogoutRoundedIcon sx={{ fontSize: 19 }} />
          </span>

          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  )
}
