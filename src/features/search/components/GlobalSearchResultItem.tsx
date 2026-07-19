import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded"
import PersonRoundedIcon from "@mui/icons-material/PersonRounded"

import { GlobalSearchResult } from "../hooks/useGlobalSearch"

interface GlobalSearchResultItemProps {
    result: GlobalSearchResult
    onClick: () => void
}


export default function GlobalSearchResultItem({result, onClick}: GlobalSearchResultItemProps) {
    const isRecipe = result.type === "recipe"
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06] text-[#feaa2b]">
                {result.image ? (
                <img
                    src={result.image}
                    alt={result.title}
                    className="h-full w-full object-cover"
                />
                ) : isRecipe ? (
                    <RestaurantRoundedIcon sx={{ fontSize: 20 }} />
                ) : (
                    <PersonRoundedIcon sx={{ fontSize: 20 }} />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                    {result.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#8f97b1]">
                    {result.subtitle}
                </p>
            </div>

            <span className="rounded-full border border-[#feaa2b]/10 bg-[#feaa2b]/[0.07] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-[#d7b474]">
                {result.type}
            </span>
        </button>
    )
}
