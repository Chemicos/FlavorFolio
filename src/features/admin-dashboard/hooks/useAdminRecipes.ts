import { useEffect, useState } from "react"
import { deleteAdminRecipes, fetchAdminRecipes } from "../services/adminRecipes.service"
import type { AdminRecipeRow } from "../types/adminRecipes.types"

export function useAdminRecipes() {
  const [recipes, setRecipes] = useState<AdminRecipeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRecipes = async () => {
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
  }

  const deleteRecipes = async (recipeIds: string[]) => {
    try {
        setIsDeleting(true)

        await deleteAdminRecipes(recipeIds)

        setRecipes((prev) =>
        prev.filter((recipe) => !recipeIds.includes(recipe.recipeId))
        )
    } finally {
        setIsDeleting(false)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  return {
    recipes,
    isLoading,
    error,
    refetch: loadRecipes,
    isDeleting,
    deleteRecipes,
  }
}