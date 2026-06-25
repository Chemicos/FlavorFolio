import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded"
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded"
import PostRecipeSelectDropdown from "../../home/components/post-recipe/PostRecipeSelectDropdown"
import RecipeReviewSearch from "../../recipe-review/components/RecipeReviewSearch"

export type ProfileRecipeSortValue =
  | "latest"
  | "oldest"
  | "popular"
  | "highest-rated"

export type ProfileRecipeViewMode = "grid" | "list"

interface ProfileRecipeToolbarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  resultCount?: number
  sortBy: ProfileRecipeSortValue
  onSortByChange: (value: ProfileRecipeSortValue) => void
  category: string
  onCategoryChange: (value: string) => void
  viewMode: ProfileRecipeViewMode
  onViewModeChange: (value: ProfileRecipeViewMode) => void
  categories?: string[]
}

const sortOptions: Array<{label: string, value: ProfileRecipeSortValue}> = [
  {
    label: "Latest",
    value: "latest",
  },
  {
    label: "Oldest",
    value: "oldest",
  },
  {
    label: "Popular",
    value: "popular",
  },
  {
    label: "Highest rated",
    value: "highest-rated",
  },
]

export default function ProfileRecipeToolbar({
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

  return (
    <section className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
        <RecipeReviewSearch 
          value={searchQuery}
          onChange={onSearchQueryChange}
          resultCount={resultCount}
          placeholder="Search my recipes..."
        />

        <div className="relative w-full sm:w-[135px]">
          <PostRecipeSelectDropdown
            value={sortBy}
            options={sortOptions}
            onChange={(value) =>
              onSortByChange(value as ProfileRecipeSortValue)
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

      <div className="flex items-center gap-2 self-end rounded-lg border border-white/10 bg-white/[0.035] p-1">
        <button
          type="button"
          aria-label="Grid view"
          onClick={() => onViewModeChange("grid")}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg transition",
            viewMode === "grid"
              ? "bg-white/[0.09] text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
              : "text-[#8f97b1] hover:bg-white/[0.06] hover:text-white",
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
              ? "bg-white/[0.09] text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
              : "text-[#8f97b1] hover:bg-white/[0.06] hover:text-white",
          ].join(" ")}
        >
          <ViewListRoundedIcon sx={{ fontSize: 22 }} />
        </button>
      </div>
    </section>
  )
}
