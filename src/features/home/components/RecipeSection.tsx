// import CircularProgress from '@mui/material/CircularProgress'
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded"
import TuneIcon from '@mui/icons-material/Tune'

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"

import type { Recipe, SavedRecipe } from "../types"
// import RecipeCard from "./RecipeCard"
import { CurrentUserCardData } from "../types/recipeCard.types"
import RecipeGridCard from './RecipeGridCard'
import RecipeGridSkeleton from './RecipeGridSkeleton'
import { CreatePostType } from "../pages/Home"
import CreatePostDropdown from "./CreatePostDropdown"

interface RecipeSectionProps {
  title: string
  recipes: Recipe[]
  currentUser: CurrentUserCardData | null
  hasMore: boolean
  isFetchingMore: boolean
  onFetchMore: () => void
  savedRecipes: SavedRecipe[]
  followingUserIds: string[]
  authorFollowersCountMap: Record<string, number>
  onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
  onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
  onRecipeClick: (recipe: Recipe) => void
  isLoading: boolean
  onOpenFilters: () => void
  onCreatePost: (postType: CreatePostType) => void
  hasActiveFilters: boolean
}

export default function RecipeSection({
    title,
    recipes,
    currentUser,
    savedRecipes,
    followingUserIds,
    authorFollowersCountMap,
    onFollowStateChange,
    onFavoriteStateChange,
    onRecipeClick,
    isLoading,
    onOpenFilters,
    onCreatePost,
    hasMore,
    isFetchingMore,
    onFetchMore,
    hasActiveFilters,
}: RecipeSectionProps) {
    const MAX_COLUMNS = 4
    const GRID_GAP = 24

    const MIN_CARD_WIDTH = 280
    const MAX_CARD_WIDTH = 350
    const CARD_HEIGHT = 370

    const ESTIMATED_ROW_HEIGHT = CARD_HEIGHT + GRID_GAP

    const sectionRef = useRef<HTMLElement | null>(null)
    const gridRef = useRef<HTMLDivElement | null>(null)

    const [columns, setColumns] = useState(4)
    const [cardWidth, setCardWidth] = useState(MAX_CARD_WIDTH)
    
    const [scrollMargin, setScrollMargin] = useState(0)

    useEffect(() => {
        const element = gridRef.current
        if (!element || isLoading) return

        const updateGridSize = () => {
            const width = element.getBoundingClientRect().width

            const availableColumns = Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP))
            const nextColumns = Math.max(1, Math.min(MAX_COLUMNS, availableColumns))

            const totalGap = (nextColumns - 1) * GRID_GAP

            const nextCardWidth = Math.min(
                MAX_CARD_WIDTH,
                Math.floor((width - totalGap) / nextColumns)
            )

            setColumns(nextColumns)
            setCardWidth(nextCardWidth)
        }

        updateGridSize()

        const observer = new ResizeObserver(updateGridSize)
        observer.observe(element)

        return () => observer.disconnect()
    }, [isLoading, recipes.length, title])

    
    useEffect(() => {
        if (!gridRef.current) return
        
        setScrollMargin(gridRef.current.offsetTop)
    }, [recipes.length, title])
    
    const rows = useMemo(() => {
        const result: Recipe[][] = []
        
        for (let index = 0; index < recipes.length; index += columns) {
            result.push(recipes.slice(index, index + columns))
        }
        
        return result
    }, [recipes, columns])
    
    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => ESTIMATED_ROW_HEIGHT,
        overscan: 4,
        scrollMargin,
    })

    useEffect(() => {
        rowVirtualizer.measure()
    }, [columns, cardWidth])
    
    const virtualRows = rowVirtualizer.getVirtualItems()            
    
    useEffect(() => {
        const lastVirtualRow = virtualRows[virtualRows.length - 1]
        if (!lastVirtualRow) return

        const isNearEnd = lastVirtualRow.index >= rows.length - 2

        if (isNearEnd && hasMore && !isFetchingMore && !isLoading) {
            onFetchMore()
        }
    }, [virtualRows, rows.length, hasMore, isFetchingMore, isLoading, onFetchMore])

    // if (!isLoading && !recipes.length) return null

  return (
    <section ref={sectionRef} className="w-full min-h-[calc(100vh-140px)]">
        <div className="mb-12 flex items-center justify-between gap-4">
            <h2 className="text-[1.3rem] 2xl-plus:text-[1.6rem] text-white/45">
                {title}
            </h2>

            <div className="flex items-center gap-4">
                <CreatePostDropdown onSelect={onCreatePost} />

                <button
                    type="button"
                    onClick={onOpenFilters}
                    aria-label="Open filters"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#a8b3cf] transition hover:bg-white/[0.06] hover:text-white active:scale-95"
                >
                    <TuneIcon sx={{ fontSize: 20 }} />
                </button>
            </div>
        </div>

        {isLoading ? (
            <RecipeGridSkeleton count={8} />
        ) : recipes.length === 0 ? (
            <div className="flex min-h-[360px] w-full items-center justify-center">
                <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-white/[0.025] px-8 py-12 text-center shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
                <h3 className="text-base font-bold text-white">
                    {hasActiveFilters
                    ? "No recipes match your filters"
                    : title === "Following"
                        ? "No recipes from followed creators"
                        : "No recipes available"}
                </h3>

                <p className="mx-auto mt-2 max-w-[390px] text-sm leading-6 text-[#8f97b1]">
                    {hasActiveFilters
                    ? "Try removing or adjusting some filters to discover more recipes."
                    : title === "Following"
                        ? "Follow more creators to see their latest published recipes here."
                        : "New recipes will appear here when they become available."}
                </p>
                </div>
            </div>
        ) : (
            <div ref={gridRef} className="relative w-full">
                <div
                    style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const rowRecipes = rows[virtualRow.index] ?? []

                        return (
                            <motion.div
                                key={virtualRow.key}
                                ref={rowVirtualizer.measureElement}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                data-index={virtualRow.index}
                                className="absolute left-0 top-0 grid w-full justify-center"
                                style={{
                                    transform: `translateY(${
                                        virtualRow.start - rowVirtualizer.options.scrollMargin
                                    }px)`,
                                    gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)`,
                                    columnGap: `${GRID_GAP}px`,
                                    paddingBottom: `${GRID_GAP}px`,
                                }}
                            >
                                {rowRecipes.map((recipe) => (
                                    <div key={recipe.recipeId}>
                                        <RecipeGridCard 
                                            recipe={recipe} 
                                            onClick={() => onRecipeClick(recipe)} 
                                            currentUser={currentUser}
                                            savedRecipes={savedRecipes}
                                            onFavoriteStateChange={onFavoriteStateChange}
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )
                        })}
                </div>
                </div>
        )}

        {/* {isFetchingMore && (
            <div className="flex w-full justify-center py-8">
                <CircularProgress size={32} thickness={4} sx={{ color: "#fff" }} />
            </div>
        )} */}
    </section>
  )
}
