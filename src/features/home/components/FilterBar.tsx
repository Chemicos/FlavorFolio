import CloseIcon from '@mui/icons-material/Close'
import PublicIcon from "@mui/icons-material/Public"
import RestaurantIcon from "@mui/icons-material/Restaurant"
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Groups2Icon from '@mui/icons-material/Groups2'
import FavoriteIcon from "@mui/icons-material/Favorite"
import StarIcon from "@mui/icons-material/Star"
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt'
import { difficultyOptions, durationOptions, mealOptions, ratingOptions, RecipeFilters, servingsOptions } from './FilterDrawer'

interface FilterBarProps {
  filters: RecipeFilters
  onChangeFilters: (filters: RecipeFilters) => void
  onResetFilters: () => void
}

function FilterChip ({
  icon,
  label,
  onRemove
}: {
  icon: React.ReactNode
  label: string
  onRemove: () => void
}) {
  return (
    <div className="group flex h-[38px] items-center justify-between gap-2 rounded-lg
        border border-white/10 bg-[#111318]/70 px-3.5 text-[#a8b3cf]
        backdrop-blur-md transition-all duration-200
        hover:border-white/15 hover:bg-[#181b22]/80
    ">
      <div className='flex items-center gap-2'>
        <span className="flex items-center text-[#a8b3cf]">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="ml-1 flex items-center justify-center text-[#a8b3cf]/50 transition hover:text-white active:text-[#a8b3cf]/50"
        aria-label={`Remove ${label} filter`}
      >
        <CloseIcon sx={{fontSize: 18}} />
      </button>
    </div>
  )
}

function getOptionLabel<T extends string | number>(
  options: { value: T; label: string }[],
  value: T
) {
  return options.find((option) => option.value === value)?.label ?? String(value)
}

export default function FilterBar({
  filters,
  onChangeFilters,
  onResetFilters,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.durations.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.cuisines.length > 0 ||
    filters.meals.length > 0 ||
    filters.ratings.length > 0 ||
    filters.servings.length > 0 ||
    filters.saved.onlySavedByMe ||
    filters.saved.mostSaved

    if (!hasActiveFilters) return null

  return (
    <div className='w-full'>
        <div className='flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl'>
          <div className='flex flex-wrap items-center gap-3'>
            
            {filters.durations.map((duration) => (
              <FilterChip 
                key={duration}
                icon={<AccessTimeIcon sx={{ fontSize: 20}} />}
                label={getOptionLabel(durationOptions, duration)}
                onRemove={() => 
                  onChangeFilters({
                    ...filters,
                    durations: filters.durations.filter((item) => item !== duration)
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

            {filters.ratings.map((rating) => (
              <FilterChip
                key={rating}
                icon={<StarIcon sx={{ fontSize: 20 }} />}
                label={getOptionLabel(ratingOptions, rating)}
                onRemove={() =>
                  onChangeFilters({
                    ...filters,
                    ratings: filters.ratings.filter((item) => item !== rating),
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

            {filters.saved.onlySavedByMe && (
              <FilterChip
                icon={<FavoriteIcon sx={{ fontSize: 20 }} />}
                label="Saved by me"
                onRemove={() =>
                  onChangeFilters({
                    ...filters,
                    saved: {
                      ...filters.saved,
                      onlySavedByMe: false,
                    },
                  })
                }
              />
            )}

            {filters.saved.mostSaved && (
              <FilterChip
                icon={<FavoriteIcon sx={{ fontSize: 20 }} />}
                label="Most saved"
                onRemove={() =>
                  onChangeFilters({
                    ...filters,
                    saved: {
                      ...filters.saved,
                      mostSaved: false,
                    },
                  })
                }
              />
            )}

            <button
              type='button'
              onClick={onResetFilters}
              className='px-3 text-[1rem] text-[#a8b3cf]/50 transition hover:text-white active:text-[#a8b3cf]'
            >
              Reset filters
            </button>
          </div>
        </div>
    </div>
  )
}
