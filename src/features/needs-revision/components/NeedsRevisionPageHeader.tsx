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
    <section>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.6rem] font-semibold text-[var(--text-primary)]">
            Needs revision
          </h1>

          <span 
            className={[
              "inline-flex min-w-6 items-center justify-center rounded-full",
              "border border-[var(--warning-border)] bg-[var(--warning-soft)]",
              "px-2 py-1 text-xs font-semibold text-[var(--warning-text)]",
            ].join(" ")}
          >
            {totalCount}
          </span>
        </div>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
                className={[
                  "inline-flex h-10 items-center gap-2 rounded-lg border px-4",
                  "border-[var(--button-danger-border)]",
                  "bg-[var(--button-danger-bg)]",
                  "text-sm font-medium text-[var(--button-danger-text)]",
                  "transition hover:bg-[var(--button-danger-hover)]",
                  "active:scale-[0.98]",
                ].join(" ")}
              >
                <DeleteRoundedIcon sx={{ fontSize: 17 }} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex h-10 items-center gap-6">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={allSelected}
          className={[
            "text-sm transition",
            allSelected
              ? "cursor-not-allowed text-[var(--text-disabled)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          ].join(" ")}
        >
          {allSelected ? "All rows selected" : "Select all"}
        </button>

        {hasSelection && (
          <>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              Clear selection
            </button>

            <span 
              className={[
                "rounded-full border border-[var(--border)]",
                "bg-[var(--surface-muted)] px-2.5 py-1",
                "text-xs font-medium text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
            </span>
          </>
        )}
      </div>
    </section>
  )
}
