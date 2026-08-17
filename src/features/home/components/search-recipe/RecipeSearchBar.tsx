import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

interface RecipeSearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
}

export default function RecipeSearchBar({
    value,
    onChange,
    resultCount,
}: RecipeSearchBarProps) {
    const hasSearch = value.trim().length > 0

    return (
        <div className="mb-6 mt-8">
            <div className="relative max-w-[450px]">
                <SearchRoundedIcon
                    sx={{ fontSize: 21, color: "#a8b3cf" }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                />

                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Search recipes, ingredients, cuisine..."
                    className="w-full rounded-xl border border-white/10 bg-[#0b0b0c]/55 py-3.5 pl-12 pr-12 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/40 focus:bg-[#0b0b0c]/80 focus:ring-2 focus:ring-orange-500/10"
                />

                {hasSearch && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7f89a6] transition hover:bg-white/[0.04] hover:text-white active:scale-95"
                >
                    <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
                )}
            </div>

            {hasSearch && (
                <p className="mt-3 text-xs text-[#7f89a6]">
                    Showing {resultCount} result{resultCount === 1 ? "" : "s"} for{" "}
                    <span className="text-[#d7def0]">"{value.trim()}"</span>
                </p>
            )}
        </div>
    )
}
