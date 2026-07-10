import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "../../../components/layout/Navigation";
import NeedsRevisionPageHeader from "../components/NeedsRevisionPageHeader";
import { NeedsRevisionRecipe } from "../types/needsRevision.types";
import { useNeedsRevisionRecipes } from "../hooks/useNeedsRevisionRecipes";
import NeedsRevisionTable from "../components/NeedsRevisionTable";
import NeedsRevisionPagination from "../components/NeedsRevisionPagination";
import { useDebounce } from "../../recipe-review/hooks/useDebounce";
import { AnimatePresence } from "motion/react";
import DeleteNeedsRevisionWindow from "../components/DeleteNeedsRevisionWindow";
import RecipeReviewDetailsDrawer from "../../recipe-review/components/RecipeReviewDetailsDrawer";
import PostRecipeDrawer from "../../home/components/post-recipe/PostRecipeDrawer";
import { Recipe } from "../../home/types";
import { useSnackbar } from "../../../components/layout/SnackbarProvider";
import { useSearchParams } from "react-router-dom";

export default function NeedsRevisionPage() {
  const { showSnackbar } = useSnackbar()

  const [selectedRecipe, setSelectedRecipe] = useState<NeedsRevisionRecipe | null>(null)
  const [isDeleteWindowOpen, setIsDeleteWindowOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [recipesToDelete, setRecipesToDelete] = useState<NeedsRevisionRecipe[]>([])
  const [isRevisionActionLoading, setIsRevisionActionLoading] = useState(false)

  const { 
    recipes, 
    isLoading, 
    error,
    deleteRecipes: deleteNeedsRevisionRecipes,
    submitRecipeForReview,
    updateRecipeDraft,
  } = useNeedsRevisionRecipes()

  const [editingRecipe, setEditingRecipe] = useState<NeedsRevisionRecipe | null>(null)
  const [previewRecipe, setPreviewRecipe] = useState<NeedsRevisionRecipe | null>(null)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const activeRecipeId = selectedRecipe?.recipeId || editingRecipe?.recipeId || previewRecipe?.recipeId || null

  const [searchParams] = useSearchParams()
  const openedRecipeFromUrlRef = useRef(false)
  const recipeIdFromUrl = searchParams.get("recipeId")

  const [detailsDrawerWidth, setDetailsDrawerWidth] = useState(540)

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

  useEffect(() => {
    if (!recipeIdFromUrl || openedRecipeFromUrlRef.current || isLoading) return

    const recipeToEdit = recipes.find(
      (recipe) => recipe.recipeId === recipeIdFromUrl
    )

    if (!recipeToEdit) return

    setEditingRecipe(null)
    setPreviewRecipe(null)
    setSelectedRecipe(recipeToEdit)

    openedRecipeFromUrlRef.current = true
  }, [recipeIdFromUrl, recipes, isLoading])

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

  const handleDetailsResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const startX = event.clientX
    const startWidth = detailsDrawerWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(760, Math.max(430, startWidth + startX - moveEvent.clientX))
      setDetailsDrawerWidth(nextWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const currentUser = useMemo(() => {
    const recipe = editingRecipe || previewRecipe || selectedRecipe

    if (!recipe) return null

    return {
      uid: recipe.userId,
      userId: recipe.userId,
      username: recipe.user || recipe.author?.username || "",
      profileImage: recipe.author?.profileImage || "",
    }
  }, [editingRecipe, previewRecipe, selectedRecipe])

  const handleConfirmDelete = async (recipeIds: string[]) => {
    try {
      setIsDeleting(true)

      await deleteNeedsRevisionRecipes(recipeIds)

      showSnackbar(`${recipeIds.length} recipe${recipeIds.length === 1 ? "" : "s"} deleted.`,"success")

      setSelectedIds([])
      setSelectedRecipe((prev) =>
        prev && recipeIds.includes(prev.recipeId) ? null : prev
      )
      setEditingRecipe((prev) =>
        prev && recipeIds.includes(prev.recipeId) ? null : prev
      )

      setIsDeleteWindowOpen(false)
      setRecipesToDelete([])
    } catch (error) {
      console.error("Failed to delete recipes:", error)
      showSnackbar("Failed to delete recipe. Please try again.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmitRevision = async (recipeId: string) => {
    try {
      setIsRevisionActionLoading(true)

      await submitRecipeForReview(recipeId)

      showSnackbar("Recipe sent for review.", "success")

      setSelectedIds([])
      setSelectedRecipe(null)
      setEditingRecipe(null)
      setPreviewRecipe(null)
    } catch (error) {
      console.error("Failed to send recipe for review:", error)
      showSnackbar("Failed to send recipe for review.", "error")
    }
    finally {
      setIsRevisionActionLoading(false)
    }
  }

  const handleRevisionDraftUpdate = async (payload: {
    recipeId: string
    payload: any
  }) => {
    const updatedRecipe = await updateRecipeDraft(payload)

    setSelectedRecipe((prev) =>
      prev?.recipeId === payload.recipeId
        ? { ...prev, ...updatedRecipe }
        : prev
    )

    setEditingRecipe((prev) =>
      prev?.recipeId === payload.recipeId
        ? { ...prev, ...updatedRecipe }
        : prev
    )
  }

  const handleOpenDeleteSelected = () => {
    if (!selectedRecipes.length) return
    setRecipesToDelete(selectedRecipes)
    setIsDeleteWindowOpen(true)
  }

  const handleOpenDeleteRecipe = (recipe: NeedsRevisionRecipe) => {
    setRecipesToDelete([recipe])
    setIsDeleteWindowOpen(true)
  }

  return (
    <div 
      className="min-h-screen bg-[#16181d] text-white transition-[padding] duration-300"
      style={{paddingRight: selectedRecipe || editingRecipe || previewRecipe ? detailsDrawerWidth : 0}}
    >
      <Navigation />

      <main className="mx-auto flex h-screen w-full max-w-[1800px] flex-col overflow-hidden px-8 pt-28">
        <NeedsRevisionPageHeader 
          search={search}
          selectedCount={selectedIds.length}
          totalCount={filteredRecipes.length}
          onSearchChange={setSearch}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds([])}
          onDeleteSelected={handleOpenDeleteSelected}
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
                activeRecipeId={activeRecipeId}
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
            recipes={recipesToDelete}
            isSubmitting={isDeleting}
            onClose={() => {
              setIsDeleteWindowOpen(false)
              setRecipesToDelete([])
            }}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRecipe && !editingRecipe && (
          <RecipeReviewDetailsDrawer
            key={selectedRecipe.recipeId}
            recipe={selectedRecipe}
            mode="revision"
            width={detailsDrawerWidth}
            isRevisionActionLoading={isRevisionActionLoading}
            onClose={() => setSelectedRecipe(null)}
            onResizeStart={handleDetailsResizeStart}
            onDeleteRecipe={handleOpenDeleteRecipe}
            onSubmitRevision={handleSubmitRevision}
            onEditRecipe={(recipe) => {
              setEditingRecipe(recipe)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingRecipe && (
          <PostRecipeDrawer
            currentUser={currentUser}
            mode="edit"
            updateMode="revision_draft"
            variant="side"
            width={detailsDrawerWidth}
            topOffset={64}
            onResizeStart={handleDetailsResizeStart}
            recipeToEdit={editingRecipe as unknown as Recipe}
            onClose={() => setEditingRecipe(null)}
            onSubmitSuccess={() => setEditingRecipe(null)}
            onUpdateSuccess={() => {
              showSnackbar("Recipe draft updated.", "success")
              setEditingRecipe(null)
            }}
            onRevisionDraftUpdate={handleRevisionDraftUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
