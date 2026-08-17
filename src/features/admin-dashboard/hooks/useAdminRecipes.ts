import { useCallback, useEffect, useState } from "react"
import { deleteAdminRecipes, fetchAdminRecipeDetails, fetchAdminRecipes } from "../services/adminRecipes.service"
import type { AdminRecipeDetails, AdminRecipeListItem } from "../types/adminRecipes.types"

export function useAdminRecipes() {
  const [recipes, setRecipes] = useState<AdminRecipeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRecipes = useCallback(
    async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await fetchAdminRecipes()

        setRecipes(result)
      } catch (error) {
        console.error("Failed to load admin recipes:", error)
        setError("Failed to load recipes.")
      } finally {
        setIsLoading(false)
      }
    }, []
  )

  const loadRecipeDetails = useCallback(async (recipeId: string): Promise<AdminRecipeDetails | null> => {
      return fetchAdminRecipeDetails(recipeId)
    }, []
  )

  const deleteRecipes = useCallback(async (recipeIds: string[]) => {
    try {
      setIsDeleting(true)

      await deleteAdminRecipes(recipeIds)

      const ids = new Set(recipeIds)

      setRecipes((prev) =>
        prev.filter(
          (recipe) =>
            !ids.has(
              recipe.recipeId
            )
        )
      )
    } finally {
      setIsDeleting(false)
    }
  },[])

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  return {
    recipes,
    isLoading,
    error,
    refetch: loadRecipes,
    loadRecipeDetails,
    isDeleting,
    deleteRecipes,
  }
}