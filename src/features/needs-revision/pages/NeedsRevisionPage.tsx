import { useEffect, useMemo, useState } from "react";
import Navigation from "../../../components/layout/Navigation";
import NeedsRevisionPageHeader from "../components/NeedsRevisionPageHeader";
import { NeedsRevisionRecipe } from "../types/needsRevision.types";
import { useNeedsRevisionRecipes } from "../hooks/useNeedsRevisionRecipes";
import NeedsRevisionTable from "../components/NeedsRevisionTable";
import NeedsRevisionPagination from "../components/NeedsRevisionPagination";
import { useDebounce } from "../../recipe-review/hooks/useDebounce";
import { AnimatePresence } from "motion/react";
import DeleteNeedsRevisionWindow from "../components/DeleteNeedsRevisionWindow";

export default function NeedsRevisionPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<NeedsRevisionRecipe | null>(null)
  const { recipes, isLoading, error } = useNeedsRevisionRecipes()

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [isDeleteWindowOpen, setIsDeleteWindowOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredRecipes = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return recipes

    return recipes.filter((recipe) => {
      const searchableText = [
        recipe.title,
        recipe.denialFeedback?.reason,
        recipe.denialFeedback?.reasonLabel,
        recipe.denialFeedback?.message,
        recipe.reviewFeedback?.description?.message,
        recipe.reviewFeedback?.ingredients?.message,
        recipe.reviewFeedback?.steps?.message,
        recipe.visibility,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [recipes, debouncedSearch])

  
  const [rowsPerPage, setRowsPerPage] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filteredRecipes.length / rowsPerPage)
  
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
  }, [debouncedSearch, rowsPerPage])

  const paginatedRecipes = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage
      return filteredRecipes.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredRecipes, currentPage, rowsPerPage])

  const handleToggleRecipe = (recipeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    )
  }

  const selectedRecipes = useMemo(() => {
    return recipes.filter((recipe) => selectedIds.includes(recipe.recipeId))
  }, [recipes, selectedIds])

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecipes.length) {
      setSelectedIds([])
      return
    }

    setSelectedIds(filteredRecipes.map((recipe) => recipe.recipeId).filter(Boolean))
  }

  const handleConfirmDelete = async (recipeIds: string[]) => {
    try {
      setIsDeleting(true)

      console.log("delete recipe ids", recipeIds)

      setSelectedIds([])
      setIsDeleteWindowOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#16181d] text-white">
      <Navigation variant="solid" />

      <main className="mx-auto flex h-screen w-full max-w-[1800px] flex-col overflow-hidden px-8 pt-28">
        <NeedsRevisionPageHeader 
          search={search}
          selectedCount={selectedIds.length}
          totalCount={filteredRecipes.length}
          onSearchChange={setSearch}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds([])}
          onDeleteSelected={() => setIsDeleteWindowOpen(true)}
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-2xl">
            <NeedsRevisionTable
                recipes={paginatedRecipes}
                selectedIds={selectedIds}
                isLoading={isLoading}
                activeRecipeId={selectedRecipe?.recipeId || null}
                onToggleRecipe={handleToggleRecipe}
                onViewRecipe={setSelectedRecipe}
            />
        </div>

        {!isLoading && filteredRecipes.length > 0 && (
            <NeedsRevisionPagination
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onRowsPerPageChange={setRowsPerPage}
                onPreviousPage={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                onNextPage={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            />
        )}
      </main>

      <AnimatePresence>
        {isDeleteWindowOpen && (
          <DeleteNeedsRevisionWindow
            isOpen={isDeleteWindowOpen}
            recipes={selectedRecipes}
            isSubmitting={isDeleting}
            onClose={() => setIsDeleteWindowOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
