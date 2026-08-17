import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import TuneRoundedIcon from "@mui/icons-material/TuneRounded"

import RecipeReviewSearch from "./RecipeReviewSearch"
import { RecipeReviewFilters } from "../types/recipeReviewFilters.types"
import RecipeReviewFilterBar from "./RecipeReviewFilterBar"
import { CircularProgress } from "@mui/material"

interface RecipeReviewPageHeaderProps {
  search: string
  selectedCount: number
  totalCount: number
  onSearchChange: (value: string) => void
  onApproveSelected: () => void
  isReviewActionLoading?: boolean
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
  isReviewActionLoading = false,
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
    <section>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.6rem] font-semibold text-[var(--text-primary)]">
            Pending recipes
          </h1>

          <span className={[
            "inline-flex min-w-6 items-center justify-center rounded-full",
            "border border-[var(--warning-border)] bg-[var(--warning-soft)]",
            "px-2 py-1 text-xs font-semibold text-[var(--warning-text)]",
          ].join(" ")}>
            {totalCount}
          </span>
        </div>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Here's a list of pending recipes that need your verification
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
            <div className="flex h-12 shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onDenySelected}
                className={[
                  "inline-flex h-10 items-center gap-2 rounded-lg border px-4",
                  "border-[var(--button-danger-border)]",
                  "bg-[var(--button-danger-bg)]",
                  "text-sm font-medium text-[var(--button-danger-text)]",
                  "transition hover:bg-[var(--button-danger-hover)]",
                  "active:scale-[0.98]",
                ].join(" ")}
              >
                <BlockRoundedIcon sx={{ fontSize: 17 }} />
                Deny
              </button>

              <button
                type="button"
                disabled={isReviewActionLoading}
                onClick={onApproveSelected}
                className={[
                  "inline-flex h-10 min-w-[104px] items-center justify-center gap-2",
                  "rounded-lg border px-4 text-sm font-medium transition",
                  "active:scale-[0.98]",
                  "border-[var(--button-success-border)]",
                  "bg-[var(--button-success-bg)]",
                  "text-[var(--button-success-text)]",
                  "hover:bg-[var(--button-success-hover)]",
                  "disabled:cursor-not-allowed disabled:opacity-45",
                ].join(" ")}
              >
                {isReviewActionLoading ? (
                  <CircularProgress size={14} thickness={5} sx={{ color: "var(--button-success-text)" }} />
                ) : (
                  <>
                    <CheckRoundedIcon sx={{ fontSize: 17 }} />
                    Approve
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenViewFilterOptions}
          className={[
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4",
            "text-sm transition active:scale-[0.98]",
            "border-[var(--button-secondary-border)]",
            "bg-[var(--button-secondary-bg)]",
            "text-[var(--button-secondary-text)]",
            "hover:bg-[var(--button-secondary-hover)]",
            "hover:text-[var(--text-primary)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
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
              ? "cursor-not-allowed text-[var(--text-disabled)]"
              : [
                  "text-[var(--text-muted)]",
                  "hover:text-[var(--text-primary)]",
                ].join(" "),
          ].join(" ")}
        >
          {allSelected ? "All rows selected" : "Select all"}
        </button>

        {hasSelection && (
          <>
            <button
              type="button"
              onClick={onClearSelection}
              className={[
                "text-sm text-[var(--text-muted)] transition",
                "hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              Clear selection
            </button>

            <span className="text-xs font-medium text-[var(--text-primary)]">
              {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
            </span>
          </>
        )}
      </div>
    </section>
  )
}
