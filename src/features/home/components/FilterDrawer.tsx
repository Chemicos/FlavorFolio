import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt"
import StarIcon from "@mui/icons-material/Star"
import FavoriteIcon from "@mui/icons-material/Favorite"
import RestaurantIcon from "@mui/icons-material/Restaurant"
import PublicIcon from "@mui/icons-material/Public"
import Groups2Icon from "@mui/icons-material/Groups2"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Checkbox, FormControlLabel } from "@mui/material"


export interface RecipeFilters {
  durations: string[]
  difficulties: string[]
  cuisines: string[]
  meals: string[]
  ratings: number[]
  servings: string[]
  saved: {
    onlySavedByMe: boolean
    mostSaved: boolean
  }
}

interface FilterDrawerProps {
  isOpen: boolean
  filters: RecipeFilters
  availableCuisines?: string[]
  onClose: () => void
  onChange: (filters: RecipeFilters) => void
  onReset: () => void
}

interface FilterSectionProps {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children?: React.ReactNode
  hasActiveFilters: boolean
}

export const durationOptions = [
  { value: "under30", label: "Under 30 min" },
  { value: "30to60", label: "30 to 60 min" },
  { value: "over60", label: "Over 60 min" },
]

export const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

export const mealOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snack" },
]

export const ratingOptions = [
  { value: 5, label: "5 stars"},
  { value: 4, label: "4 stars & up" },
  { value: 3, label: "3 stars & up" },
  { value: 2, label: "2 stars & up"},
  { value: 1, label: "1 star & up"}
]

export const servingsOptions = [
  { value: "1to2", label: "1 to 2 servings" },
  { value: "3to4", label: "3 to 4 servings" },
  { value: "5plus", label: "5+ servings" },
]

function FilterSection({
    title,
    icon,
    isOpen,
    onToggle,
    hasActiveFilters = false,
    children,
}: FilterSectionProps) {
    return (
        <div className="w-full">
            <button
                type="button"
                onClick={onToggle}
                className={[
                   "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-left transition",
                    hasActiveFilters
                        ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]" 
                ].join(" ")}
            >
                <div className="flex items-center gap-3">
                    <span className="flex items-center">{icon}</span>
                    <span>{title}</span>

                    {hasActiveFilters && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-[var(--accent)]" />
                    )}
                </div>

                <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center text-[var(--text-muted)]"
                >
                    <KeyboardArrowDownIcon sx={{ fontSize: 22 }} />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0, y: -6 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -6 }}
                    transition={{
                    duration: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                    }}
                    className="overflow-hidden pl-6"
                >
                    <div className="border-l border-[var(--border-strong)] mt-2 pr-4">
                    {children}
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
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

                        color: "var(--text-disabled)",

                        "&.Mui-checked": {
                        color: "var(--accent)",
                        },

                        "& .MuiSvgIcon-root": {
                        fontSize: 20,
                        },
                    }}
                />
            }
            label={<span className="text-sm text-[var(--text-secondary)]">{label}</span> }
            sx={{
                margin: 0,
                cursor: "pointer",

                padding: "7px 10px",
                transition: "background-color 0.18s ease, transform 0.18s ease",

                borderTopRightRadius: "5px",
                borderBottomRightRadius: "5px",

                "&:hover": {
                    backgroundColor: "var(--surface-hover)",
                },       
            }}
        />
    )
}

function toggleStringValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function toggleNumberValue(list: number[], value: number) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

export const defaultRecipeFilters: RecipeFilters = {
  durations: [],
  difficulties: [],
  cuisines: [],
  meals: [],
  ratings: [],
  servings: [],
  saved: {
    onlySavedByMe: false,
    mostSaved: false,
  },
}

function getSectionWithActiveFilters(filters: RecipeFilters) {
    return {
        duration: filters.durations.length > 0,
        difficulty: filters.difficulties.length > 0,
        cuisine: filters.cuisines.length > 0,
        meal: filters.meals.length > 0,
        rating: filters.ratings.length > 0,
        servings: filters.servings.length > 0,
        saved: filters.saved.onlySavedByMe || filters.saved.mostSaved,
    }
}

function getInitialOpenSections(filters: RecipeFilters) {
    const activeSections = getSectionWithActiveFilters(filters)

    return {
        duration: activeSections.duration || true,
        difficulty: activeSections.difficulty || true,
        cuisine: activeSections.cuisine,
        meal: activeSections.meal,
        rating: activeSections.rating,
        servings: activeSections.servings,
        saved: activeSections.saved,
    }
}

export default function FilterDrawer({
    isOpen,
    filters,
    availableCuisines = [],
    onClose,
    onChange,
    onReset
}: FilterDrawerProps) {
    const [openSections, setOpenSections] = useState(() => getInitialOpenSections(filters))
    const activeSections = getSectionWithActiveFilters(filters)
    const hasActiveFilters = Object.values(activeSections).some(Boolean)

    const [cuisineSearch, setCuisineSearch] = useState("")

    const normalizedCuisines = useMemo(() => {
        return [...new Set(availableCuisines.map((item) => item.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
    }, [availableCuisines])

    const filteredCuisines = useMemo(() => {
        return normalizedCuisines.filter(
            (cuisine) => cuisine.toLowerCase().includes(cuisineSearch.toLowerCase())
        ).filter((cuisine) => !filters.cuisines.includes(cuisine))
    }, [normalizedCuisines, cuisineSearch, filters.cuisines])

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections((prev) => ({
        ...prev,
        [key]: !prev[key],
        }))
    }

  return (
        <div className="fixed inset-0 z-[70]">
            <motion.div 
                className="absolute inset-0 bg-[var(--overlay)]" 
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.2, ease: "easeOut"}}
                onClick={onClose}
            /> 

            <motion.aside 
                initial={{x: "-100%"}}
                animate={{x: 0}}
                exit={{ x: "-110%"}}
                transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 28,
                    mass: 1,
                }}
                className="relative flex flex-col left-0 top-0 h-full w-full max-w-[300px]
                border-r border-[var(--border)] bg-[var(--bg-elevated)]
                py-8 shadow-[var(--shadow-panel)]"
            >   
                <div className="flex flex-col px-6">
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-[1.2rem] text-[var(--text-primary)]">Filter recipes</h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">Refine the current feed</p>
                        </div>

                        <button
                            type="button"
                            aria-label="Close drawer"
                            onClick={onClose}
                            className="
                                absolute right-0 top-10 flex h-10 w-10 translate-x-1/2
                                items-center justify-center rounded-lg border
                                border-[var(--drawer-control-border)]
                                bg-[var(--drawer-control-bg)]
                                text-[var(--text-secondary)]
                                shadow-[var(--shadow-card)]
                                transition
                                hover:bg-[var(--drawer-control-hover)]
                                hover:text-[var(--text-primary)]
                            "
                        >
                            <KeyboardArrowLeftIcon sx={{ fontSize: 24 }} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onReset}
                        disabled={!hasActiveFilters}
                        className={[
                            "mr-auto mb-6 rounded-lg border px-4 py-2 text-sm transition",
                            hasActiveFilters
                                ? "border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]"
                                : "cursor-not-allowed border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-disabled)] opacity-60",
                        ].join(" ")}
                    >
                        Reset filters
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
                    <div className="flex flex-col gap-3 px-6">
                        <FilterSection
                            title="Duration"
                            icon={<AccessTimeIcon sx={{fontSize: 18}} />}
                            isOpen={openSections.duration}
                            onToggle={() => toggleSection("duration")}
                            hasActiveFilters={activeSections.duration}
                        >
                            <div className="flex flex-col">
                                {durationOptions.map((option) => (
                                    <CheckboxRow 
                                        key={option.value}
                                        label={option.label}
                                        checked={filters.durations.includes(option.value)}
                                        onChange={() => 
                                            onChange({
                                                ...filters,
                                                durations: toggleStringValue(filters.durations, option.value)
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection
                            title="Difficulty"
                            icon={<SignalCellularAltIcon sx={{ fontSize: 18 }} />}
                            isOpen={openSections.difficulty}
                            onToggle={() => toggleSection("difficulty")}
                            hasActiveFilters={activeSections.difficulty}
                        >
                            <div className="flex flex-col">
                            {difficultyOptions.map((option) => (
                                <CheckboxRow
                                key={option.value}
                                label={option.label}
                                checked={filters.difficulties.includes(option.value)}
                                onChange={() =>
                                    onChange({
                                    ...filters,
                                    difficulties: toggleStringValue(filters.difficulties, option.value),
                                    })
                                }
                                />
                            ))}
                            </div>
                        </FilterSection>

                        <FilterSection
                            title="Cuisine"
                            icon={<PublicIcon sx={{ fontSize: 18 }} />}
                            isOpen={openSections.cuisine}
                            onToggle={() => toggleSection("cuisine")}
                            hasActiveFilters={activeSections.cuisine}
                        >
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    value={cuisineSearch}
                                    onChange={(e) => setCuisineSearch(e.target.value)}
                                    placeholder="Search cuisines..."
                                    className="mb-2 ml-2 mr-4 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)]
                                    px-3 py-2 text-sm text-[var(--text-primary)]
                                    outline-none transition
                                    placeholder:text-[var(--input-placeholder)]
                                    hover:bg-[var(--input-bg-hover)]
                                    focus:border-[var(--focus-border)]
                                    focus:ring-2 focus:ring-[var(--focus-ring)]"
                                />

                                {filteredCuisines.length ? (
                                    filteredCuisines.map((cuisine) => (
                                    <CheckboxRow
                                        key={cuisine}
                                        label={cuisine}
                                        checked={filters.cuisines.includes(cuisine)}
                                        onChange={() =>
                                        onChange({
                                            ...filters,
                                            cuisines: toggleStringValue(filters.cuisines, cuisine),
                                        })
                                        }
                                    />
                                    ))
                                ) : (
                                    <p className="ml-2 text-sm text-[var(--text-muted)]">No cuisines available yet.</p>
                                )}
                            </div>
                        </FilterSection>

                        <FilterSection
                            title="Meal"
                            icon={<RestaurantIcon sx={{ fontSize: 18 }} />}
                            isOpen={openSections.meal}
                            onToggle={() => toggleSection("meal")}
                            hasActiveFilters={activeSections.meal}
                        >
                            <div className="flex flex-col">
                            {mealOptions.map((option) => (
                                <CheckboxRow
                                key={option.value}
                                label={option.label}
                                checked={filters.meals.includes(option.value)}
                                onChange={() =>
                                    onChange({
                                    ...filters,
                                    meals: toggleStringValue(filters.meals, option.value),
                                    })
                                }
                                />
                            ))}
                            </div>
                        </FilterSection>

                        <FilterSection
                            title="Rating"
                            icon={<StarIcon sx={{ fontSize: 18 }} />}
                            isOpen={openSections.rating}
                            onToggle={() => toggleSection("rating")}
                            hasActiveFilters={activeSections.rating}
                        >
                            <div className="flex flex-col">
                            {ratingOptions.map((option) => (
                                <CheckboxRow
                                key={option.value}
                                label={option.label}
                                checked={filters.ratings.includes(option.value)}
                                onChange={() =>
                                    onChange({
                                    ...filters,
                                    ratings: toggleNumberValue(filters.ratings, option.value),
                                    })
                                }
                                />
                            ))}
                            </div>
                        </FilterSection>

                        <FilterSection
                            title="Servings"
                            icon={<Groups2Icon sx={{ fontSize: 18 }} />}
                            isOpen={openSections.servings}
                            onToggle={() => toggleSection("servings")}
                            hasActiveFilters={activeSections.servings}
                        >
                            <div className="flex flex-col">
                            {servingsOptions.map((option) => (
                                <CheckboxRow
                                key={option.value}
                                label={option.label}
                                checked={filters.servings.includes(option.value)}
                                onChange={() =>
                                    onChange({
                                    ...filters,
                                    servings: toggleStringValue(filters.servings, option.value),
                                    })
                                }
                                />
                            ))}
                            </div>
                        </FilterSection>

                        <FilterSection
                            title="Saved"
                            icon={<FavoriteIcon sx={{ fontSize: 18 }} />}
                            isOpen={openSections.saved}
                            onToggle={() => toggleSection("saved")}
                            hasActiveFilters={activeSections.saved}
                        >
                            <div className="flex flex-col">
                            <CheckboxRow
                                label="Saved by me"
                                checked={filters.saved.onlySavedByMe}
                                onChange={() =>
                                onChange({
                                    ...filters,
                                    saved: {
                                    ...filters.saved,
                                    onlySavedByMe: !filters.saved.onlySavedByMe,
                                    },
                                })
                                }
                            />

                            <CheckboxRow
                                label="Most saved"
                                checked={filters.saved.mostSaved}
                                onChange={() =>
                                onChange({
                                    ...filters,
                                    saved: {
                                    ...filters.saved,
                                    mostSaved: !filters.saved.mostSaved,
                                    },
                                })
                                }
                            />
                            </div>
                        </FilterSection>
                    </div>
                </div>
            </motion.aside>
        </div>
  )
}
