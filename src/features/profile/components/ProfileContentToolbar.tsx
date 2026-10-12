import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded"
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded"
import PostRecipeSelectDropdown from "../../home/components/post-recipe/PostRecipeSelectDropdown"
import RecipeReviewSearch from "../../recipe-review/components/RecipeReviewSearch"
import { ProfileContentType } from "./ProfileContentSwitcher"

export type ProfileContentSortValue =
  | "latest"
  | "oldest"
  | "popular"
  | "highest-rated"

export type ProfileContentViewMode = "grid" | "list"

interface ProfileRecipeToolbarProps {
  contentType: ProfileContentType
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  resultCount?: number
  sortBy: ProfileContentSortValue
  onSortByChange: (value: ProfileContentSortValue) => void
  category: string
  onCategoryChange: (value: string) => void
  viewMode: ProfileContentViewMode
  onViewModeChange: (value: ProfileContentViewMode) => void
  categories?: string[]
}

const sortOptions: Array<{label: string, value: ProfileContentSortValue}> = [
  {label: "Latest", value: "latest"},
  {label: "Oldest",value: "oldest"},
  {label: "Popular",value: "popular"},
  {label: "Highest rated",value: "highest-rated"},
]

export default function ProfileContentToolbar({
  contentType,
  searchQuery,
  onSearchQueryChange,
  resultCount,
  sortBy,
  onSortByChange,
  category,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  categories = [],
}:ProfileRecipeToolbarProps) {
    const categoryOptions = [
        {
            label: "All categories",
            value: "all",
        },
        ...categories.map((item) => ({
            label: item,
            value: item.toLowerCase(),
        })),
    ]

    const availableSortOptions = contentType === "reels" ? sortOptions.filter((option) => option.value !== "highest-rated") : sortOptions

  return (
    <section className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
        <RecipeReviewSearch 
          value={searchQuery}
          onChange={onSearchQueryChange}
          resultCount={resultCount}
          placeholder={
            contentType === "recipes"
              ? "Search recipes..."
              : "Search reels..."
          }
        />

        <div className="relative w-full sm:w-[135px]">
          <PostRecipeSelectDropdown
            value={sortBy}
            options={availableSortOptions}
            onChange={(value) =>
              onSortByChange(value as ProfileContentSortValue)
            }
          />
        </div>

        <div className="relative w-full sm:w-[190px]">
          <PostRecipeSelectDropdown
            value={category}
            options={categoryOptions}
            onChange={onCategoryChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 self-end rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
        <button
          type="button"
          aria-label="Grid view"
          onClick={() => onViewModeChange("grid")}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg transition",
            viewMode === "grid"
              ? "bg-[var(--surface-active)] text-[var(--text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
          ].join(" ")}
        >
          <GridViewRoundedIcon sx={{ fontSize: 21 }} />
        </button>

        <button
          type="button"
          aria-label="List view"
          onClick={() => onViewModeChange("list")}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg transition",
            viewMode === "list"
              ? "bg-[var(--surface-active)] text-[var(--text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
          ].join(" ")}
        >
          <ViewListRoundedIcon sx={{ fontSize: 22 }} />
        </button>
      </div>
    </section>
  )
}
