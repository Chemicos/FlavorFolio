import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { deleteNeedsRevisionRecipes, fetchNeedsRevisionRecipes, submitNeedsRevisionRecipe, subscribeToNeedsRevisionRecipes, updateNeedsRevisionRecipe, UpdateNeedsRevisionRecipePayload } from "../services/needsRevision.service"

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

  // useEffect(() => {
  //   const auth = getAuth()
  //   let isMounted = true

  //   const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //     if (!user) {
  //       if (isMounted) {
  //         setRecipes([])
  //         setIsLoading(false)
  //       }
  //       return
  //     }

  //     try {
  //       setIsLoading(true)
  //       setError(null)

  //       const result = await fetchNeedsRevisionRecipes(user.uid)

  //       if (isMounted) {
  //         setRecipes(result)
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch needs revision recipes:", err)

  //       if (isMounted) {
  //         setError("Failed to load recipes that need revision.")
  //       }
  //     } finally {
  //       if (isMounted) {
  //         setIsLoading(false)
  //       }
  //     }
  //   })

  //   return () => {
  //     isMounted = false
  //     unsubscribe()
  //   }
  // }, [])

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

  // const deleteRecipes = async (recipeIds: string[]) => {
  //   await deleteNeedsRevisionRecipes(recipeIds)

  //   setRecipes((prev) =>
  //     prev.filter((recipe) => !recipeIds.includes(recipe.recipeId))
  //   )
  // }

  const deleteRecipes = async (recipeIds: string[]) => {
    await deleteNeedsRevisionRecipes(recipeIds)

    setRecipes((currentRecipes) =>
      currentRecipes.filter(
        (recipe) => !recipeIds.includes(recipe.recipeId)
      )
    )
  }

  // const submitRecipeForReview = async (recipeId: string) => {
  //   await submitNeedsRevisionRecipe(recipeId)

  //   setRecipes((prev) =>
  //     prev.filter((recipe) => recipe.recipeId !== recipeId)
  //   )
  // }

  const submitRecipeForReview = async (recipeId: string) => {
    await submitNeedsRevisionRecipe(recipeId)

    setRecipes((currentRecipes) =>
      currentRecipes.filter(
        (recipe) => recipe.recipeId !== recipeId
      )
    )
  }

  // const updateRecipeDraft = async ({
  //   recipeId,
  //   payload,
  // }: {
  //   recipeId: string
  //   payload: UpdateNeedsRevisionRecipePayload
  // }) => {
  //   const updatedRecipeData = await updateNeedsRevisionRecipe({ recipeId, payload })

  //   const updatedRecipe = {
  //     ...updatedRecipeData,
  //     recipeId,
  //   }

  //   setRecipes((prev) =>
  //     prev.map((recipe) =>
  //       recipe.recipeId === recipeId
  //         ? {
  //             ...recipe,
  //             ...updatedRecipeData,
  //           }
  //         : recipe
  //     )
  //   )

  //   return updatedRecipe
  // }

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