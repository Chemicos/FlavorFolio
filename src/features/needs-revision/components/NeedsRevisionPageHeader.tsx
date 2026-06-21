import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"

import RecipeReviewSearch from "../../recipe-review/components/RecipeReviewSearch"

interface NeedsRevisionPageHeaderProps {
  search: string
  selectedCount: number
  totalCount: number
  onSearchChange: (value: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onDeleteSelected: () => void
}

export default function NeedsRevisionPageHeader({
  search,
  selectedCount,
  totalCount,
  onSearchChange,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
}: NeedsRevisionPageHeaderProps) {
  const hasSelection = selectedCount > 0
  const allSelected = totalCount > 0 && selectedCount === totalCount

  return (
    <section className="mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.6rem] font-semibold text-white">
            Needs revision
          </h1>

          <span className="text-xs font-medium text-[#6f7892]">
            {totalCount}
          </span>
        </div>

        <p className="mt-2 text-sm text-[#a8b3cf]">
          Recipes that require changes before they can be published again.
        </p>
      </div>

      <div className="mt-8 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <RecipeReviewSearch
            value={search}
            onChange={onSearchChange}
            resultCount={totalCount}
          />

          {hasSelection && (
            <div className="flex h-12 shrink-0 items-center">
              <button
                type="button"
                onClick={onDeleteSelected}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-400/10 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
              >
                <DeleteRoundedIcon sx={{ fontSize: 17 }} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* <button
          type="button"
          onClick={onOpenViewFilterOptions}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white"
        >
          <TuneRoundedIcon sx={{ fontSize: 20 }} />
          View
        </button> */}
      </div>

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
