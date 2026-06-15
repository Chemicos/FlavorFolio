import { ReviewRecipe } from "../types/recipeReview.types"

import { useEffect, useMemo, useState } from "react"
import { usePendingRecipes } from "../hooks/usePendingRecipes"
import Navigation from "../../../components/layout/Navigation"
import RecipeReviewPageHeader from "../components/RecipeReviewPageHeader"
import RecipeReviewTable from "../components/RecipeReviewTable"
import { useDebounce } from "../hooks/useDebounce"
import RecipeReviewPagination from "../components/RecipeReviewPagination"
import { defaultRecipeReviewFilters, RecipeReviewFilters } from "../types/recipeReviewFilters.types"
import { AnimatePresence } from "motion/react"
import RecipeReviewFilterDrawer from "../components/RecipeReviewFilterDrawer"
import RecipeReviewDetailsDrawer from "../components/RecipeReviewDetailsDrawer"
import { ReviewSectionKey } from "../services/recipeReview.service"
import { ReviewSectionFeedback } from "../components/RecipeReviewSectionHeader"

export default function PendingRecipesPage() {
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedRecipe, setSelectedRecipe] = useState<ReviewRecipe | null>(null)
    const debouncedSearch = useDebounce(search, 300)

    const [rowsPerPage, setRowsPerPage] = useState(12)
    const [currentPage, setCurrentPage] = useState(1)

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [filters, setFilters] = useState<RecipeReviewFilters>(defaultRecipeReviewFilters)
    
    const {recipes, isLoading, error, handleReviewFeedbackStateChange} = usePendingRecipes()

    const [detailsDrawerWidth, setDetailsDrawerWidth] = useState(540)

    const filteredRecipes = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase()

        let result = recipes

        if (query) {
            result = result.filter((recipe) => {
            const searchableText = [
                recipe.title,
                recipe.description,
                recipe.cuisine,
                recipe.difficulty,
                recipe.meal,
                recipe.author?.username,
                recipe.user,
                ...(recipe.ingredients || []).map((item) => item.ingredient),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()

            return searchableText.includes(query)
            })
        }

        return result.filter((recipe) => {
            const duration = Number(recipe.durationMinutes || 0)
            const servings = Number(recipe.servings || 0)
            const steps = recipe.cookingSteps?.length || 0

            const matchesDifficulty =
            !filters.difficulties.length || filters.difficulties.includes(recipe.difficulty || "")

            const matchesCuisine =
            !filters.cuisines.length || filters.cuisines.includes(recipe.cuisine || "")

            const matchesMeal =
            !filters.meals.length || filters.meals.includes(recipe.meal || "")

            const matchesDuration =
            !filters.durations.length ||
            filters.durations.some((filter) => {
                if (filter === "under30") return duration < 30
                if (filter === "30to60") return duration >= 30 && duration <= 60
                if (filter === "over60") return duration > 60
                return false
            })

            const matchesServings =
            !filters.servings.length ||
            filters.servings.some((filter) => {
                if (filter === "1to2") return servings >= 1 && servings <= 2
                if (filter === "3to4") return servings >= 3 && servings <= 4
                if (filter === "5plus") return servings >= 5
                return false
            })

            const matchesSteps =
            !filters.steps.length ||
            filters.steps.some((filter) => {
                if (filter === "0") return steps === 0
                if (filter === "1to3") return steps >= 1 && steps <= 3
                if (filter === "4to7") return steps >= 4 && steps <= 7
                if (filter === "8plus") return steps >= 8
                return false
            })

            return (
                matchesDifficulty &&
                matchesCuisine &&
                matchesMeal &&
                matchesDuration &&
                matchesServings &&
                matchesSteps
            )
        })
    }, [recipes, debouncedSearch, filters])

    const availableCuisines = useMemo(() => {
        return [...new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))] as string[]
    }, [recipes])

    const totalPages = Math.ceil(filteredRecipes.length / rowsPerPage)

    const paginatedRecipes = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage
        return filteredRecipes.slice(startIndex, startIndex + rowsPerPage)
    }, [filteredRecipes, currentPage, rowsPerPage])

    useEffect(() => {
        setCurrentPage(1)
        setSelectedIds([])
    }, [debouncedSearch, rowsPerPage])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(totalPages, 1))
        }
    }, [currentPage, totalPages])

    const handleToggleRecipe = (recipeId: string) => {
        setSelectedIds((prev) =>
            prev.includes(recipeId)
                ? prev.filter((id) => id !== recipeId)
                : [...prev, recipeId]
        )
    }

    const handleSelectAll = () => {
        if (selectedIds.length === filteredRecipes.length) {
            setSelectedIds([])
            return
        }

        setSelectedIds(filteredRecipes.map((recipe) => recipe.recipeId))
    }

    const handleDetailsResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()

        const startX = event.clientX
        const startWidth = detailsDrawerWidth

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.min(760, Math.max(420, startWidth + startX - moveEvent.clientX))

            setDetailsDrawerWidth(nextWidth)
        }

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }

    const handleFeedbackSaved = (
        recipeId: string,
        section: ReviewSectionKey,
        feedback: ReviewSectionFeedback
    ) => {
        handleReviewFeedbackStateChange(recipeId, section, feedback)

        setSelectedRecipe((prev) => {
            if (!prev || prev.recipeId !== recipeId) return prev

            return {
            ...prev,
            reviewFeedback: {
                ...prev.reviewFeedback,
                [section]: feedback,
            },
            }
        })
    }

    return (
        <div 
            className="min-h-screen bg-[#16181d] text-white transition-[padding] duration-300"
            style={{
                paddingRight: selectedRecipe ? detailsDrawerWidth : 0
            }}
        >
            <Navigation />

            <main className="mx-auto flex h-screen w-full max-w-[1800px] flex-col overflow-hidden px-8 pt-28">
                <RecipeReviewPageHeader 
                    search={search}
                    selectedCount={selectedIds.length}
                    totalCount={filteredRecipes.length}
                    onSearchChange={setSearch}
                    onSelectAll={handleSelectAll}
                    onClearSelection={() => setSelectedIds([])}
                    onApproveSelected={() => {}}
                    onDenySelected={() => {}}
                    onOpenViewFilterOptions={() => setIsFilterDrawerOpen(true)}
                    filters={filters}
                    onChangeFilters={setFilters}
                    onResetFilters={() => setFilters(defaultRecipeReviewFilters)}
                />

                {error && (
                    <div className="mt-8 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
                    <div className="min-h-0 flex-1 overflow-hidden">
                        <RecipeReviewTable 
                            recipes={paginatedRecipes}
                            selectedIds={selectedIds}
                            isLoading={isLoading}
                            onToggleRecipe={handleToggleRecipe}
                            onViewRecipe={setSelectedRecipe}
                        />
                    </div>

                    {!isLoading && filteredRecipes.length > 0 && (
                        <RecipeReviewPagination
                            totalCount={filteredRecipes.length}
                            rowsPerPage={rowsPerPage}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onRowsPerPageChange={setRowsPerPage}
                            onPreviousPage={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                            onNextPage={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                        />
                    )}
                </div>
            </main>

            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <RecipeReviewFilterDrawer
                       isOpen={isFilterDrawerOpen}
                        filters={filters}
                        availableCuisines={availableCuisines}
                        onClose={() => setIsFilterDrawerOpen(false)}
                        onChange={setFilters}
                        onReset={() => setFilters(defaultRecipeReviewFilters)} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedRecipe && (
                    <RecipeReviewDetailsDrawer
                        key={selectedRecipe.recipeId}
                        recipe={selectedRecipe}
                        width={detailsDrawerWidth}
                        onClose={() => setSelectedRecipe(null)}
                        onResizeStart={handleDetailsResizeStart}
                        onFeedbackSaved={handleFeedbackSaved}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
