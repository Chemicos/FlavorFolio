import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded"
import SmartDisplayRoundedIcon from "@mui/icons-material/SmartDisplayRounded"

export type ProfileContentType = "recipes" | "reels"

interface ProfileContentSwitcher {
    value: ProfileContentType
    onChange: (value: ProfileContentType) => void
}

const options = [
    {
        value: "recipes" as const,
        label: "Recipes",
        icon: RestaurantMenuRoundedIcon
    },
    {
        value: "reels" as const,
        label: "Reels",
        icon: SmartDisplayRoundedIcon
    }
] as const

export default function ProfileContentSwitcher({
    value,
    onChange
}: ProfileContentSwitcher) {
    
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
      {options.map((option) => {
        const Icon = option.icon
        const isActive = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
              isActive
                ? "!bg-[var(--accent)] !text-[var(--text-on-accent)]"
                : "!bg-transparent !text-[var(--text-secondary)] hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)]",
            ].join(" ")}
          >
            <Icon sx={{ fontSize: 17 }} />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
