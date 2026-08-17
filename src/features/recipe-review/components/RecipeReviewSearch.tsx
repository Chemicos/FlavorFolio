import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

interface RecipeReviewSearchProps {
  value: string
  onChange: (value: string) => void
  resultCount?: number
  placeholder?: string
}

export default function RecipeReviewSearch({
  value,
  onChange,
  resultCount,
  placeholder = "Search recipe...",
}: RecipeReviewSearchProps) {
  const hasValue = value.trim().length > 0
  return (
    <div className="w-full sm:w-[260px]">
      <div
        className={[
          "relative flex h-12 items-center rounded-md border bg-[var(--input-bg)] transition",
          hasValue
            ? "border-[var(--focus-border)] shadow-[0_0_0_2px_var(--focus-ring)]"
            : "border-[var(--input-border)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)]",
        ].join(" ")}
      >
        <SearchRoundedIcon
          sx={{ fontSize: 19 }}
          className={[
            "absolute left-4 transition-colors",
            hasValue
              ? "text-[var(--accent)]"
              : "text-[var(--text-muted)]",
          ].join(" ")}
        />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full rounded-lg bg-transparent pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--input-placeholder)]"
        />

        {hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:scale-95"
          >
            <CloseRoundedIcon sx={{ fontSize: 17 }} />
          </button>
        )}
      </div>

      {hasValue && typeof resultCount === "number" && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Showing {resultCount} result{resultCount === 1 ? "" : "s"} for "{value}"
        </p>
      )}
    </div>
  )
}
