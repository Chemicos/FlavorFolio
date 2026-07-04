import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import CircularProgress from "@mui/material/CircularProgress"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SelectAllRoundedIcon from "@mui/icons-material/SelectAllRounded"

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useAdminRecipes } from "../hooks/useAdminRecipes";
import { AdminRecipeRow } from "../types/adminRecipes.types";
import AdminRecipesTable from "../components/AdminRecipesTable";
import RecipeReviewPagination from "../../recipe-review/components/RecipeReviewPagination";
import AdminRecipeDetailsDrawer from "../components/AdminRecipeDetailsDrawer";
import { AnimatePresence } from "motion/react";
import DeleteWarningDialog from "../../home/components/recipe-view-drawer/DeleteWarningDialog"


export default function AdminRecipesPage() {
    const { recipes, isLoading, error, refetch, isDeleting, deleteRecipes } = useAdminRecipes()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedRecipe, setSelectedRecipe] = useState<AdminRecipeRow | null>(null)

    const [search, setSearch] = useState("")

    const [rowsPerPage, setRowsPerPage] = useState(12)
    const [currentPage, setCurrentPage] = useState(1)
    const [detailsDrawerWidth, setDetailsDrawerWidth] = useState(540)


    const handleToggleRecipe = (recipeId: string) => {
        setSelectedIds((prev) =>
            prev.includes(recipeId)
            ? prev.filter((id) => id !== recipeId)
            : [...prev, recipeId]
        )
    }

    const handleDetailsResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()

        const startX = event.clientX
        const startWidth = detailsDrawerWidth

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.min(
            760,
            Math.max(430, startWidth + startX - moveEvent.clientX)
            )

            setDetailsDrawerWidth(nextWidth)
        }

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }

    const filteredRecipes = useMemo(() => {
        const query = search.trim().toLowerCase()

        if (!query) return recipes

        return recipes.filter((recipe) => {
        return [
            recipe.title,
            recipe.authorUsername,
            recipe.status,
            recipe.meal,
            recipe.cuisine,
            recipe.difficulty,
        ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        })
    }, [recipes, search])

    const totalPages = Math.ceil(filteredRecipes.length / rowsPerPage)

    const paginatedRecipes = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage
        return filteredRecipes.slice(startIndex, startIndex + rowsPerPage)
    }, [filteredRecipes, currentPage, rowsPerPage])

    const selectedRecipes = useMemo(() => {
        return recipes.filter((recipe) => selectedIds.includes(recipe.recipeId))
    }, [recipes, selectedIds])

    const selectedCount = selectedIds.length

    const handleSelectCurrentPage = () => {
        setSelectedIds((prev) => {
            const pageIds = paginatedRecipes.map((recipe) => recipe.recipeId)
            return Array.from(new Set([...prev, ...pageIds]))
        })
    }

    const handleClearSelection = () => {setSelectedIds([])}

    const handleConfirmDelete = async () => {
        if (!selectedIds.length) return

        await deleteRecipes(selectedIds)

        if (selectedRecipe && selectedIds.includes(selectedRecipe.recipeId)) {
            setSelectedRecipe(null)
        }

        setSelectedIds([])
        setIsDeleteDialogOpen(false)
    }

    useEffect(() => {
        setCurrentPage(1)
        setSelectedIds([])
    }, [search, rowsPerPage])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(totalPages, 1))
        }
    }, [currentPage, totalPages])

  return (
    <AdminLayout fullHeight rightOffset={selectedRecipe ? detailsDrawerWidth : 0}>
        <header className="shrink-0 flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Recipes
              </h1>
              <p className="mt-2 text-sm text-[#8f97b1]">
                Manage and inspect all recipes submitted on FlavorFolio.
              </p>
            </div>

            <button
              type="button"
              onClick={refetch}
              className="self-start rounded-lg border border-white/10 bg-white/[0.04] p-[5px] text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white lg:self-auto"
            >
              <RefreshRoundedIcon sx={{ fontSize: 26 }} />
            </button>
        </header>

        <section className="mt-5 grid shrink-0 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5">
              <p className="text-sm text-[#8f97b1]">Total Recipes</p>
              <h2 className="mt-2 text-2xl font-bold">{recipes.length}</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5">
              <p className="text-sm text-[#8f97b1]">Published</p>
              <h2 className="mt-2 text-2xl font-bold text-emerald-300">
                {recipes.filter((recipe) => recipe.status === "published").length}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5">
              <p className="text-sm text-[#8f97b1]">Pending / Revision</p>
              <h2 className="mt-2 text-2xl font-bold text-[#feaa2b]">
                {
                  recipes.filter(
                    (recipe) =>
                      recipe.status === "pending" ||
                      recipe.status === "needs_revision"
                  ).length
                }
              </h2>
            </div>
        </section>

        <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16181d] p-5">
            <div className="mb-5 shrink-0 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                    <h2 className="text-base font-bold text-white">Recipe Library</h2>

                    {selectedCount > 0 && (
                        <p className="mt-1 text-sm text-[#8f97b1]">
                        {selectedCount} {selectedCount === 1 ? "recipe" : "recipes"} selected
                        </p>
                    )}
                    </div>

                    <div className="relative w-full md:w-[360px]">
                    <SearchRoundedIcon
                        sx={{ fontSize: 18 }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7892]"
                    />

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search recipes, authors, cuisine..."
                        className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0b0c] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50"
                    />
                    </div>
                </div>

                {selectedCount > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0b0c]/70 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                        type="button"
                        onClick={handleSelectCurrentPage}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white"
                        >
                        <SelectAllRoundedIcon sx={{ fontSize: 18 }} />
                        Select page
                        </button>

                        <button
                        type="button"
                        onClick={handleClearSelection}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-[#a8b3cf] transition hover:bg-white/[0.08] hover:text-white"
                        >
                        <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        Clear
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/15 bg-red-500/10 px-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                    >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                        Delete selected
                    </button>
                    </div>
                )}
            </div>

            {isLoading ? (
              <div className="flex h-[320px] items-center justify-center">
                <CircularProgress size={32} sx={{ color: "#feaa2b" }} />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
                <div className="min-h-0 flex-1 overflow-hidden">
                    <AdminRecipesTable
                        recipes={paginatedRecipes}
                        selectedIds={selectedIds}
                        isLoading={isLoading}
                        activeRecipeId={selectedRecipe?.recipeId || null}
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
                    onPreviousPage={() =>
                        setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    onNextPage={() =>
                        setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    />
                )}
                </div>
                
            )}
        </section>

        <AnimatePresence>
            {selectedRecipe && (
                <AdminRecipeDetailsDrawer
                key={selectedRecipe.recipeId}
                recipe={selectedRecipe}
                width={detailsDrawerWidth}
                onClose={() => setSelectedRecipe(null)}
                onResizeStart={handleDetailsResizeStart}
                />
            )}
        </AnimatePresence>

        <DeleteWarningDialog
            isOpen={isDeleteDialogOpen}
            isDeleting={isDeleting}
            title={selectedCount === 1 ? "Delete recipe?" : "Delete recipes?"}
            description={
                selectedCount === 1
                ? `Are you sure you want to delete "${selectedRecipes[0]?.title || "this recipe"}"? This action cannot be undone.`
                : `Are you sure you want to delete ${selectedCount} recipes? This action cannot be undone.`
            }
            confirmLabel="Delete"
            onCancel={() => {
                if (isDeleting) return
                setIsDeleteDialogOpen(false)
            }}
            onConfirm={handleConfirmDelete}
        />
    </AdminLayout>
  )
}
