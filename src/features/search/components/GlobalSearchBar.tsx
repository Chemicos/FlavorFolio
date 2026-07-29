import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import CircularProgress from "@mui/material/CircularProgress"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded"

import { useNavigate } from "react-router-dom"
import { useEffect, useMemo, useRef, useState } from "react"
import { GlobalSearchResult, useGlobalSearch } from "../hooks/useGlobalSearch"
import { AnimatePresence, motion } from "motion/react"
import GlobalSearchResultItem from "./GlobalSearchResultItem"
import { auth } from "../../../firebase-config"

type GlobalSearchTab = "all" | "recipe" | "user"
const PREVIEW_RESULTS_COUNT = 6

const searchTabs: Array<{
  value: GlobalSearchTab
  label: string
}> = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "recipe",
    label: "Recipes",
  },
  {
    value: "user",
    label: "Users",
  },
]

export default function GlobalSearchBar() {
    const navigate = useNavigate()
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    const [search, setSearch] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    const [activeTab, setActiveTab] = useState<GlobalSearchTab>("all")
    const [showAllResults, setShowAllResults] = useState(false)

    const { results, isLoading } = useGlobalSearch(search)

    const hasSearch = search.trim().length > 0
    const shouldShowPanel = isFocused && hasSearch

     const recipeResultsCount = useMemo(
        () =>
        results.filter(
            (result) =>
            result.type === "recipe"
        ).length,
        [results]
    )

    const userResultsCount = useMemo(
        () =>
        results.filter(
            (result) => result.type === "user"
        ).length,
        [results]
    )

    const filteredResults = useMemo(() => {
        if (activeTab === "all") {
        return results
        }

        return results.filter(
        (result) =>
            result.type === activeTab
        )
    }, [results, activeTab])

    const visibleResults = useMemo(() => {
        if (showAllResults) {
        return filteredResults
        }

        return filteredResults.slice(
        0,
        PREVIEW_RESULTS_COUNT
        )
    }, [
        filteredResults,
        showAllResults,
    ])

    const hiddenResultsCount = Math.max( 0, filteredResults.length - PREVIEW_RESULTS_COUNT )

    const canToggleAllResults = filteredResults.length > PREVIEW_RESULTS_COUNT

    useEffect(() => {
        setShowAllResults(false)
    }, [search, activeTab])

    const handleResultClick = (
        result: GlobalSearchResult
    ) => {
        setSearch("")
        setIsFocused(false)
        setShowAllResults(false)
        setActiveTab("all")

        if (result.type === "recipe") {
        navigate(
            `/home?recipeId=${result.id}`
        )
        return
        }

        const currentUserId =
        auth.currentUser?.uid

        if (result.id === currentUserId) {
        navigate("/profile")
        return
        }

        navigate(`/users/${result.id}`)
    }

    const emptyMessage = useMemo(() => {
        if (search.trim().length < 2) {
            return "Type at least 2 characters."
        }

        if (activeTab === "recipe") {
            return "No recipes found."
        }

        if (activeTab === "user") {
            return "No users found."
        }

        return "No results found."
    }, [search, activeTab])

    const emptyDescription =
        activeTab === "recipe"
        ? "Try searching by recipe title, cuisine, meal or ingredient."
        : activeTab === "user"
            ? "Try searching by username or full name."
            : "Try searching by recipe title, cuisine, ingredient or username."

    const getTabCount = (tab: GlobalSearchTab) => {
        if (tab === "recipe") {
            return recipeResultsCount
        }

        if (tab === "user") {
            return userResultsCount
        }

        return results.length
    }

    return (
        <div
            ref={wrapperRef}
            className="relative w-full max-w-[620px]"
            onBlur={(event) => {
                const nextFocusedElement = event.relatedTarget as Node | null

                if (
                    !nextFocusedElement ||
                    !wrapperRef.current?.contains(
                        nextFocusedElement
                    )
                ) {
                 setIsFocused(false)
                }
            }}
        >
            <div className="relative">
                <SearchRoundedIcon
                    sx={{ fontSize: 20 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[var(--text-muted)]"
                />

                <input
                    value={search}
                    onFocus={() => setIsFocused(true)}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search recipes, ingredients, cuisine, users..."
                    className="h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-12 pr-12 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                />

                {hasSearch && (
                <button
                    type="button"
                    onClick={() => {
                        setSearch("")
                        setShowAllResults(false)
                        setActiveTab("all")
                    }}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                    <CloseRoundedIcon sx={{ fontSize: 18 }}/>
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
                    className="absolute left-0 right-0 top-14 z-[90] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-dropdown)] transition-colors duration-200"
                >
                    <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
                        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                            Search results
                        </p>

                        <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
                            {searchTabs.map((tab) => {
                            const isActive = activeTab === tab.value

                            const tabCount = getTabCount(tab.value)

                            return (
                                <button
                                key={tab.value}
                                type="button"
                                onClick={() => setActiveTab( tab.value )}
                                className={[
                                    "relative flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[0.7rem] font-semibold transition",
                                    isActive
                                    ? "bg-[var(--surface-active)] text-[var(--text-primary)]"
                                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                                >
                                <span>
                                    {tab.label}
                                </span>

                                {tabCount > 0 && (
                                    <span
                                    className={[
                                        "flex min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem]",
                                        isActive
                                        ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                                        : "bg-[var(--surface-muted)] text-[var(--text-muted)]",
                                    ].join(" ")}
                                    >
                                        {tabCount}
                                    </span>
                                )}
                                </button>
                            )
                            })}
                        </div>
                        </header>

                        <motion.div
                            layout
                            className={[
                                "overscroll-contain overflow-y-auto p-2",
                                "[scrollbar-width:thin]",
                                "[scrollbar-color:rgba(168,179,207,0.35)_transparent]",
                                showAllResults
                                ? "max-h-[520px]"
                                : "max-h-[420px]",
                            ].join(" ")}
                        >
                        {isLoading ? (
                            <div className="flex h-28 items-center justify-center">
                            <CircularProgress
                                size={24}
                                sx={{
                                color: "#feaa2b",
                                }}
                            />
                            </div>
                        ) : visibleResults.length ? (
                            <motion.div
                            layout
                            className="space-y-1"
                            >
                            <AnimatePresence
                                initial={false}
                                mode="popLayout"
                            >
                                {visibleResults.map(
                                (result) => (
                                    <motion.div
                                    layout
                                    key={`${result.type}-${result.id}`}
                                    initial={{opacity: 0, y: 4,}}
                                    animate={{ opacity: 1, y: 0, }}
                                    exit={{ opacity: 0, y: -4, }}
                                    transition={{ duration: 0.14, }}
                                    >
                                    <GlobalSearchResultItem
                                        result={result}
                                        onClick={() =>
                                        handleResultClick(
                                            result
                                        )
                                        }
                                    />
                                    </motion.div>
                                )
                                )}
                            </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="px-4 py-10 text-center">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {emptyMessage}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                                {emptyDescription}
                            </p>
                            </div>
                        )}
                        </motion.div>

                        {!isLoading && canToggleAllResults && (
                            <footer className="border-t border-[var(--border)] p-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAllResults((previous) => !previous)
                                }
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                            >
                                {showAllResults ? (
                                <>
                                    Show fewer results
                                    <KeyboardArrowUpRoundedIcon sx={{ fontSize: 17, }} />
                                </>
                                ) : (
                                <>
                                    Show all results
                                    {hiddenResultsCount >
                                    0 && (
                                    <span className="text-[var(--text-muted)]">
                                        ({filteredResults.length})
                                    </span>
                                    )}
                                    <KeyboardArrowDownRoundedIcon sx={{ fontSize: 17, }} />
                                </>
                                )}
                            </button>
                            </footer>
                        )}
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
