import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import TuneRoundedIcon from "@mui/icons-material/TuneRounded"

import RecipeReviewSearch from "./RecipeReviewSearch"
import { RecipeReviewFilters } from "../types/recipeReviewFilters.types"
import RecipeReviewFilterBar from "./RecipeReviewFilterBar"

interface RecipeReviewPageHeaderProps {
  search: string
  selectedCount: number
  totalCount: number
  onSearchChange: (value: string) => void
  onApproveSelected: () => void
  onDenySelected: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onOpenViewFilterOptions?: () => void
  filters: RecipeReviewFilters
  onChangeFilters: (filters: RecipeReviewFilters) => void
  onResetFilters: () => void
}

export default function RecipeReviewPageHeader({
  search, 
  selectedCount, 
  totalCount, 
  onSearchChange,
  onApproveSelected, 
  onDenySelected, 
  onSelectAll, 
  onClearSelection,
  onOpenViewFilterOptions,
  filters,
  onChangeFilters,
  onResetFilters
}: RecipeReviewPageHeaderProps) {
  const hasSelection = selectedCount > 0
  const allSelected = totalCount > 0 && selectedCount === totalCount

  return (
    <section className="mb-8">
      <div>
        <h1 className="text-[1.8rem] font-semibold text-white">
          Pending recipes
        </h1>

        <p className="mt-2 text-sm text-[#a8b3cf]">
          Here's a list of pending recipes that need your verification
        </p>
      </div>

      <div className="mt-8 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <RecipeReviewSearch
            value={search}
            onChange={onSearchChange}
            resultCount={totalCount}
          />

          {hasSelection && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onDenySelected}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-400/10 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
              >
                <BlockRoundedIcon sx={{ fontSize: 17 }} />
                Deny
              </button>

              <button
                type="button"
                onClick={onApproveSelected}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-lime-400/10 bg-lime-500/10 px-4 text-sm font-medium text-lime-300 transition hover:bg-lime-500/15"
              >
                <CheckRoundedIcon sx={{ fontSize: 17 }} />
                Approve
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenViewFilterOptions}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white"
        >
          <TuneRoundedIcon sx={{ fontSize: 20 }} />
          View
        </button>
      </div>

      <RecipeReviewFilterBar
        filters={filters}
        onChangeFilters={onChangeFilters}
        onResetFilters={onResetFilters}
      />

      <div className="mt-5 flex h-10 items-center gap-6">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={allSelected}
          className={[
            "text-sm transition",
            allSelected
              ? "cursor-not-allowed text-[#7f89a6]/40"
              : "text-[#7f89a6] hover:text-white",
          ].join(" ")}
        >
          {allSelected ? "All rows selected" : "Select all"}
        </button>

        {hasSelection && (
          <>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-sm text-[#7f89a6] transition hover:text-white"
            >
              Clear selection
            </button>

            <span className="text-xs font-medium text-white">
              {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
            </span>
          </>
        )}
      </div>
    </section>
  )
}
