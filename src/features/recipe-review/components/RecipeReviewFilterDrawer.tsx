import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt"
import PublicIcon from "@mui/icons-material/Public"
import RestaurantIcon from "@mui/icons-material/Restaurant"
import Groups2Icon from "@mui/icons-material/Groups2"
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded"
import { RecipeReviewFilters } from "../types/recipeReviewFilters.types"
import { Checkbox, FormControlLabel } from "@mui/material"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"

interface RecipeReviewFilterDrawerProps {
  isOpen: boolean
  filters: RecipeReviewFilters
  availableCuisines: string[]
  onClose: () => void
  onChange: (filters: RecipeReviewFilters) => void
  onReset: () => void
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

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={onChange}
          sx={{
            padding: 0,
            marginRight: "10px",
            color: "rgba(168,179,207,0.5)",
            "&.Mui-checked": { color: "#d8ddeb" },
            "& .MuiSvgIcon-root": { fontSize: 20 },
          }}
        />
      }
      label={<span className="text-sm text-[#a8b3cf]">{label}</span>}
      sx={{
        margin: 0,
        cursor: "pointer",
        padding: "7px 10px",
        borderTopRightRadius: "5px",
        borderBottomRightRadius: "5px",
        "&:hover": { backgroundColor: "#202429" },
      }}
    />
  )
}

function FilterSection({
  title,
  icon,
  isOpen,
  hasActiveFilters,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  hasActiveFilters: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition",
          hasActiveFilters ? "bg-white/[0.04] text-white" : "hover:bg-[#202429]/80",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 text-[#b8c0d9]">
          {icon}
          <span>{title}</span>
          {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-[#a8b3cf]" />}
        </div>

        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
          <KeyboardArrowDownIcon sx={{ fontSize: 22 }} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden pl-6"
          >
            <div className="mt-2 border-l border-[#a8b3cf]/40 pr-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getOpenSectionsFromFilters(filters: RecipeReviewFilters) {
  return {
    duration: filters.durations.length > 0 || true,
    difficulty: filters.difficulties.length > 0 || true,
    cuisine: filters.cuisines.length > 0,
    meal: filters.meals.length > 0,
    servings: filters.servings.length > 0,
    steps: filters.steps.length > 0,
  }
}

export default function RecipeReviewFilterDrawer({
    isOpen,
    filters,
    availableCuisines,
    onClose,
    onChange,
    onReset,
}: RecipeReviewFilterDrawerProps) {
    const [openSections, setOpenSections] = useState(() =>
        getOpenSectionsFromFilters(filters)
    )

    const [cuisineSearch, setCuisineSearch] = useState("")

    useEffect(() => {
        if (!isOpen) return

        setOpenSections(getOpenSectionsFromFilters(filters))
    }, [isOpen])

    const cuisines = useMemo(() => {
        return [...new Set(availableCuisines.map((item) => item.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
    }, [availableCuisines])

    const filteredCuisines = cuisines.filter((cuisine) =>
        cuisine.toLowerCase().includes(cuisineSearch.toLowerCase())
    )

    const hasNoCuisineResults = cuisineSearch.trim().length > 0 && filteredCuisines.length === 0

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const active = {
        duration: filters.durations.length > 0,
        difficulty: filters.difficulties.length > 0,
        cuisine: filters.cuisines.length > 0,
        meal: filters.meals.length > 0,
        servings: filters.servings.length > 0,
        steps: filters.steps.length > 0,
    }

    if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90]">
      <motion.div
        className="absolute inset-0 bg-[#0b0b0c]/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-110%" }}
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
        className="relative left-0 top-0 flex h-full w-full max-w-[360px] flex-col border-r border-white/10 bg-[#050506]/70 py-8 shadow-[20px_0_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
      >
        <div className="px-6">
          <h2 className="text-[1.4rem] text-[#d7def0]">Review filters</h2>
          <p className="mt-1 text-sm text-[#7f89a6]">Refine pending submissions</p>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-10 flex h-10 w-10 translate-x-1/2 items-center justify-center rounded-lg border border-white/10 bg-[#16181d]/90 text-[#a8b3cf] transition hover:bg-[#202429] hover:text-white"
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: 24 }} />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="mb-6 mt-8 rounded-lg border border-white/10 px-4 py-2 text-sm text-[#a8b3cf]/70 transition hover:bg-white/[0.04] hover:text-white"
          >
            Reset filters
          </button>
        </div>

        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
          <div className="flex flex-col gap-3 px-6">
            <FilterSection title="Duration" icon={<AccessTimeIcon sx={{ fontSize: 20 }} />} isOpen={openSections.duration} hasActiveFilters={active.duration} onToggle={() => toggleSection("duration")}>
              <div className="flex flex-col">
                {durationOptions.map((option) => (
                  <CheckboxRow key={option.value} label={option.label} checked={filters.durations.includes(option.value)} onChange={() => onChange({ ...filters, durations: toggleValue(filters.durations, option.value) })} />
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Difficulty" icon={<SignalCellularAltIcon sx={{ fontSize: 20 }} />} isOpen={openSections.difficulty} hasActiveFilters={active.difficulty} onToggle={() => toggleSection("difficulty")}>
              <div className="flex flex-col">
                {difficultyOptions.map((option) => (
                  <CheckboxRow key={option.value} label={option.label} checked={filters.difficulties.includes(option.value)} onChange={() => onChange({ ...filters, difficulties: toggleValue(filters.difficulties, option.value) })} />
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Cuisine" icon={<PublicIcon sx={{ fontSize: 20 }} />} isOpen={openSections.cuisine} hasActiveFilters={active.cuisine} onToggle={() => toggleSection("cuisine")}>
              <div className="flex flex-col gap-2">
                <input
                  value={cuisineSearch}
                  onChange={(event) => setCuisineSearch(event.target.value)}
                  placeholder="Search cuisines..."
                  className="mb-2 ml-2 rounded-md border border-white/10 bg-[#101215] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6b7280] focus:border-white/20"
                />

                {hasNoCuisineResults && (
                    <p className="ml-2 text-sm text-[#7f89a6]">
                        No cuisines found for "{cuisineSearch}"
                    </p>
                )}

                {filteredCuisines.map((cuisine) => (
                  <CheckboxRow key={cuisine} label={cuisine} checked={filters.cuisines.includes(cuisine)} onChange={() => onChange({ ...filters, cuisines: toggleValue(filters.cuisines, cuisine) })} />
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Meal" icon={<RestaurantIcon sx={{ fontSize: 20 }} />} isOpen={openSections.meal} hasActiveFilters={active.meal} onToggle={() => toggleSection("meal")}>
              <div className="flex flex-col">
                {mealOptions.map((option) => (
                  <CheckboxRow key={option.value} label={option.label} checked={filters.meals.includes(option.value)} onChange={() => onChange({ ...filters, meals: toggleValue(filters.meals, option.value) })} />
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Servings" icon={<Groups2Icon sx={{ fontSize: 20 }} />} isOpen={openSections.servings} hasActiveFilters={active.servings} onToggle={() => toggleSection("servings")}>
              <div className="flex flex-col">
                {servingsOptions.map((option) => (
                  <CheckboxRow key={option.value} label={option.label} checked={filters.servings.includes(option.value)} onChange={() => onChange({ ...filters, servings: toggleValue(filters.servings, option.value) })} />
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Steps" icon={<FormatListNumberedRoundedIcon sx={{ fontSize: 20 }} />} isOpen={openSections.steps} hasActiveFilters={active.steps} onToggle={() => toggleSection("steps")}>
              <div className="flex flex-col">
                {stepsOptions.map((option) => (
                  <CheckboxRow key={option.value} label={option.label} checked={filters.steps.includes(option.value)} onChange={() => onChange({ ...filters, steps: toggleValue(filters.steps, option.value) })} />
                ))}
              </div>
            </FilterSection>
          </div>
        </div>
      </motion.aside>
    </div>
  )
}
