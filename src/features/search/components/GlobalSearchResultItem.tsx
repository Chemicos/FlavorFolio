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
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--surface-hover)]"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-subtle)] text-[var(--accent)]">
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
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {result.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                    {result.subtitle}
                </p>
            </div>

            <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-[var(--accent-text)]">
                {result.type}
            </span>
        </button>
    )
}
