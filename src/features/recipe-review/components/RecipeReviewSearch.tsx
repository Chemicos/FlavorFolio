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
          "relative flex h-12 items-center rounded-md border bg-[#0b0b0c] transition",
          hasValue
            ? "border-orange-400/35 shadow-[0_0_0_1px_rgba(254,170,43,0.08)]"
            : "border-white/10 hover:border-white/20",
        ].join(" ")}
      >
        <SearchRoundedIcon
          sx={{ fontSize: 19 }}
          className="absolute left-4 text-[#7f89a6]"
        />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full rounded-lg bg-transparent pl-11 pr-11 text-sm text-white outline-none placeholder:text-[#6f7892]"
        />

        {hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#7f89a6] transition hover:bg-white/[0.04] hover:text-white active:scale-95"
          >
            <CloseRoundedIcon sx={{ fontSize: 17 }} />
          </button>
        )}
      </div>

      {hasValue && typeof resultCount === "number" && (
        <p className="mt-2 text-xs text-[#7f89a6]">
          Showing {resultCount} result{resultCount === 1 ? "" : "s"} for "{value}"
        </p>
      )}
    </div>
  )
}
