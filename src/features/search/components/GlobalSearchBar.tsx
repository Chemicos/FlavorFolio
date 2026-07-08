import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import CircularProgress from "@mui/material/CircularProgress"
import { useNavigate } from "react-router-dom"
import { useEffect, useMemo, useRef, useState } from "react"
import { useGlobalSearch } from "../hooks/useGlobalSearch"
import { AnimatePresence, motion } from "motion/react"
import GlobalSearchResultItem from "./GlobalSearchResultItem"
import { auth } from "../../../firebase-config"

export default function GlobalSearchBar() {
    const navigate = useNavigate()
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    const [search, setSearch] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    const { results, isLoading } = useGlobalSearch(search)

    const hasSearch = search.trim().length > 0
    const shouldShowPanel = isFocused && hasSearch

    const handleResultClick = (result: typeof results[number]) => {
        setSearch("")
        setIsFocused(false)

        if (result.type === "recipe") {
            navigate(`/home?recipeId=${result.id}`)
            return
        }

        const currentUserId = auth.currentUser?.uid

        if (result.id === currentUserId) {
            navigate("/profile")
            return
        }
        
        navigate(`/users/${result.id}`)
    }

    const emptyMessage = useMemo(() => {
        if (search.trim().length < 3) return "Type at least 3 characters."
        return "No results found."
    }, [search])

    return (
        <div
            ref={wrapperRef}
            className="relative hidden w-full max-w-[620px] lg:block"
            onBlur={(event) => {
                if (!wrapperRef.current?.contains(event.relatedTarget as Node)) {
                setIsFocused(false)
                }
            }}
        >
            <div className="relative">
                <SearchRoundedIcon
                    sx={{ fontSize: 20 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[#8f97b1]"
                />

                <input
                    value={search}
                    onFocus={() => setIsFocused(true)}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search recipes, ingredients, cuisine, users..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#111216]/90 pl-12 pr-12 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-[#feaa2b]/40 focus:ring-2 focus:ring-[#feaa2b]/10"
                />

                {hasSearch && (
                <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                >
                    <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
                )}
            </div>

            <AnimatePresence>
                {shouldShowPanel && (
                <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 right-0 top-14 z-[90] overflow-hidden rounded-2xl border border-white/10 bg-[#1b1d22] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
                >
                    <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8f97b1]">
                        Search results
                    </p>
                    </div>

                    <div 
                        className="max-h-[420px] overscroll-contain overflow-y-auto p-2 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]"
                    >
                    {isLoading ? (
                        <div className="flex h-28 items-center justify-center">
                        <CircularProgress size={24} sx={{ color: "#feaa2b" }} />
                        </div>
                    ) : results.length ? (
                        <div className="space-y-1">
                        {results.map((result) => (
                            <GlobalSearchResultItem
                            key={`${result.type}-${result.id}`}
                            result={result}
                            onClick={() => handleResultClick(result)}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center">
                        <p className="text-sm font-semibold text-white">
                            {emptyMessage}
                        </p>
                        <p className="mt-1 text-xs text-[#8f97b1]">
                            Try searching by recipe title, cuisine, ingredient or username.
                        </p>
                        </div>
                    )}
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
