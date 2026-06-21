import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { deleteNeedsRevisionRecipes, fetchNeedsRevisionRecipes, submitNeedsRevisionRecipe, updateNeedsRevisionRecipe, UpdateNeedsRevisionRecipePayload } from "../services/needsRevision.service"

export function useNeedsRevisionRecipes() {
  const [recipes, setRecipes] = useState<NeedsRevisionRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) {
          setRecipes([])
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await fetchNeedsRevisionRecipes(user.uid)

        if (isMounted) {
          setRecipes(result)
        }
      } catch (err) {
        console.error("Failed to fetch needs revision recipes:", err)

        if (isMounted) {
          setError("Failed to load recipes that need revision.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const deleteRecipes = async (recipeIds: string[]) => {
    await deleteNeedsRevisionRecipes(recipeIds)

    setRecipes((prev) =>
      prev.filter((recipe) => !recipeIds.includes(recipe.recipeId))
    )
  }

  const submitRecipeForReview = async (recipeId: string) => {
    await submitNeedsRevisionRecipe(recipeId)

    setRecipes((prev) =>
      prev.filter((recipe) => recipe.recipeId !== recipeId)
    )
  }

  const updateRecipeDraft = async ({
    recipeId,
    payload,
  }: {
    recipeId: string
    payload: UpdateNeedsRevisionRecipePayload
  }) => {
    const updatedRecipeData = await updateNeedsRevisionRecipe({ recipeId, payload })

    const updatedRecipe = {
      ...updatedRecipeData,
      recipeId,
    }

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.recipeId === recipeId
          ? {
              ...recipe,
              ...updatedRecipeData,
            }
          : recipe
      )
    )

    return updatedRecipe
  }

  return {
    recipes,
    isLoading,
    error,
    deleteRecipes,
    submitRecipeForReview,
    updateRecipeDraft,
  }
}