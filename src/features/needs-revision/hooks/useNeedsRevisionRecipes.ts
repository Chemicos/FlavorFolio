import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import {
  deleteNeedsRevisionRecipes, 
  submitRecipeForReview as submitRecipeForReviewService, 
  subscribeToNeedsRevisionRecipes, 
  updateNeedsRevisionRecipe, 
  UpdateNeedsRevisionRecipePayload 
} from "../services/needsRevision.service"

export function useNeedsRevisionRecipes() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [recipes, setRecipes] = useState<NeedsRevisionRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const nextUserId = user?.uid || null

      setCurrentUserId(nextUserId)

      if (!nextUserId) {
        setRecipes([])
        setError(null)
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeToNeedsRevisionRecipes({
      userId: currentUserId,

      onChange: (nextRecipes) => {
        setRecipes(nextRecipes)
        setIsLoading(false)
        setError(null)
      },

      onError: (error) => {
        console.error(
          "Failed to subscribe to needs revision recipes:",
          error
        )

        setError("Failed to load recipes that need revision.")
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [currentUserId])

  const deleteRecipes = async (recipeIds: string[]) => {
    await deleteNeedsRevisionRecipes(recipeIds)

    setRecipes((currentRecipes) =>
      currentRecipes.filter(
        (recipe) => !recipeIds.includes(recipe.recipeId)
      )
    )
  }

  const submitRecipeForReview = async (recipeId: string) => {
    await submitRecipeForReviewService(recipeId)

    setRecipes((currentRecipes) =>
      currentRecipes.filter(
        (recipe) => recipe.recipeId !== recipeId
      )
    )
  }

  const updateRecipeDraft = async ({
    recipeId,
    payload,
  }: {
    recipeId: string
    payload: UpdateNeedsRevisionRecipePayload
  }) => {
    const updatedRecipeData = await updateNeedsRevisionRecipe({
      recipeId,
      payload,
    })

    const updatedRecipe = {
      ...updatedRecipeData,
      recipeId,
    }

    setRecipes((currentRecipes) =>
      currentRecipes.map((recipe) =>
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