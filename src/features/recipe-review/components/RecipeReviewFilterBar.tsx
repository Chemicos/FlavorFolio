import CloseIcon from "@mui/icons-material/Close"
import PublicIcon from "@mui/icons-material/Public"
import RestaurantIcon from "@mui/icons-material/Restaurant"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import Groups2Icon from "@mui/icons-material/Groups2"
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt"
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded"
import { RecipeReviewFilters } from "../types/recipeReviewFilters.types"

interface RecipeReviewFilterBarProps {
  filters: RecipeReviewFilters
  onChangeFilters: (filters: RecipeReviewFilters) => void
  onResetFilters: () => void
}

const durationOptions = [
  { value: "under30", label: "Under 30 min" },
  { value: "30to60", label: "30 to 60 min" },
  { value: "over60", label: "Over 60 min" },
]

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

const mealOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snack" },
]

const servingsOptions = [
  { value: "1to2", label: "1 to 2 servings" },
  { value: "3to4", label: "3 to 4 servings" },
  { value: "5plus", label: "5+ servings" },
]

const stepsOptions = [
  { value: "0", label: "No steps" },
  { value: "1to3", label: "1 to 3 steps" },
  { value: "4to7", label: "4 to 7 steps" },
  { value: "8plus", label: "8+ steps" },
]

function getOptionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

function FilterChip({
  icon,
  label,
  onRemove,
}: {
  icon: React.ReactNode
  label: string
  onRemove: () => void
}) {
  return (
    <div 
      className={[
        "group flex h-[38px] items-center justify-between gap-2 rounded-lg border px-3.5",
        "border-[var(--button-secondary-border)]",
        "bg-[var(--button-secondary-bg)]",
        "text-[var(--button-secondary-text)]",
        "shadow-[var(--shadow-card)] backdrop-blur-md",
        "transition",
        "hover:border-[var(--border-strong)]",
        "hover:bg-[var(--button-secondary-hover)]",
        "hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className={[
          "ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          "text-[var(--text-muted)] transition",
          "hover:bg-[var(--surface-hover)]",
          "hover:text-[var(--text-primary)]",
          "active:scale-95",
        ].join(" ")}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </button>
    </div>
  )
}

export default function RecipeReviewFilterBar({
    filters,
    onChangeFilters,
    onResetFilters,
}: RecipeReviewFilterBarProps) {
    const hasActiveFilters =
        filters.durations.length > 0 ||
        filters.difficulties.length > 0 ||
        filters.cuisines.length > 0 ||
        filters.meals.length > 0 ||
        filters.servings.length > 0 ||
        filters.steps.length > 0

    if (!hasActiveFilters) return null

  return (
    <div className="mt-5 w-full max-w-full">
      <div className="flex flex-wrap items-center gap-3">
        {filters.durations.map((duration) => (
          <FilterChip
            key={duration}
            icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
            label={getOptionLabel(durationOptions, duration)}
            onRemove={() =>
              onChangeFilters({
                ...filters,
                durations: filters.durations.filter((item) => item !== duration),
              })
            }
          />
        ))}

        {filters.difficulties.map((difficulty) => (
          <FilterChip
            key={difficulty}
            icon={<SignalCellularAltIcon sx={{ fontSize: 20 }} />}
            label={getOptionLabel(difficultyOptions, difficulty)}
            onRemove={() =>
              onChangeFilters({
                ...filters,
                difficulties: filters.difficulties.filter((item) => item !== difficulty),
              })
            }
          />
        ))}

        {filters.cuisines.map((cuisine) => (
          <FilterChip
            key={cuisine}
            icon={<PublicIcon sx={{ fontSize: 20 }} />}
            label={cuisine}
            onRemove={() =>
              onChangeFilters({
                ...filters,
                cuisines: filters.cuisines.filter((item) => item !== cuisine),
              })
            }
          />
        ))}

        {filters.meals.map((meal) => (
          <FilterChip
            key={meal}
            icon={<RestaurantIcon sx={{ fontSize: 20 }} />}
            label={getOptionLabel(mealOptions, meal)}
            onRemove={() =>
              onChangeFilters({
                ...filters,
                meals: filters.meals.filter((item) => item !== meal),
              })
            }
          />
        ))}

        {filters.servings.map((serving) => (
          <FilterChip
            key={serving}
            icon={<Groups2Icon sx={{ fontSize: 20 }} />}
            label={getOptionLabel(servingsOptions, serving)}
            onRemove={() =>
              onChangeFilters({
                ...filters,
                servings: filters.servings.filter((item) => item !== serving),
              })
            }
          />
        ))}

        {filters.steps.map((step) => (
          <FilterChip
            key={step}
            icon={<FormatListNumberedRoundedIcon sx={{ fontSize: 20 }} />}
            label={getOptionLabel(stepsOptions, step)}
            onRemove={() =>
              onChangeFilters({
                ...filters,
                steps: filters.steps.filter((item) => item !== step),
              })
            }
          />
        ))}

        <button
          type="button"
          onClick={onResetFilters}
          className={[
            "h-[38px] rounded-lg px-3 text-sm transition",
            "text-[var(--text-muted)]",
            "hover:bg-[var(--surface-hover)]",
            "hover:text-[var(--text-primary)]",
            "active:scale-[0.98]",
          ].join(" ")}
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}
