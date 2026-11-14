import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useRef, useState } from "react"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import {
  deleteNeedsRevisionRecipes, 
  submitRecipeForReview as submitRecipeForReviewService, 
  subscribeToNeedsRevisionRecipes, 
  updateNeedsRevisionRecipe, 
  UpdateNeedsRevisionRecipePayload 
} from "../services/needsRevision.service"
import { SaveRecipeEditOptions } from "../../home/services/recipeEditCallable.service"
import { isDefinitiveOperationError } from "../../home/utils/callableRetry"

export function useNeedsRevisionRecipes() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const previousAuthUserIdRef = useRef<string | null>(null)

  const pendingSendIdsRef = useRef(new Map<string, string>())
  const inFlightSendsRef = useRef(new Map<string, Promise<void>>())

  const [recipes, setRecipes] = useState<NeedsRevisionRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [uncertainSendRecipeIds, setUncertainSendRecipeIds] = useState<string[]>([])

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const nextUserId = user?.uid || null

      if (previousAuthUserIdRef.current !== nextUserId) {
        pendingSendIdsRef.current.clear()
        inFlightSendsRef.current.clear()
        setUncertainSendRecipeIds([])
        previousAuthUserIdRef.current = nextUserId
      }

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

  // const submitRecipeForReview = async (recipeId: string) => {
  //   await submitRecipeForReviewService(recipeId)

  //   setRecipes((currentRecipes) =>
  //     currentRecipes.filter(
  //       (recipe) => recipe.recipeId !== recipeId
  //     )
  //   )
  // }

  const submitRecipeForReview = (recipeId: string): Promise<void> => {
    const existingPromise = inFlightSendsRef.current.get(recipeId)

    if (existingPromise) {
      return existingPromise
    }

    let requestId = pendingSendIdsRef.current.get(recipeId)

    if (!requestId) {
      requestId = crypto.randomUUID()
      pendingSendIdsRef.current.set(recipeId, requestId)
    }

    const operation = (async () => {
      try {
        await submitRecipeForReviewService(recipeId, requestId)

        // The backend confirmed success, including an
        // idempotent retry of an already completed request.
        pendingSendIdsRef.current.delete(recipeId)

        setUncertainSendRecipeIds((current) =>
          current.filter((id) => id !== recipeId)
        )

        setRecipes((current) =>
          current.filter((recipe) => recipe.recipeId !== recipeId)
        )
      } catch (error) {
        if (isDefinitiveOperationError(error)) {
          pendingSendIdsRef.current.delete(recipeId)

          setUncertainSendRecipeIds((current) =>
            current.filter((id) => id !== recipeId)
          )
        } else {
          // Keep requestId so the user can retry,
          // even if the recipe disappeared from the query.
          setUncertainSendRecipeIds((current) =>
            current.includes(recipeId)
              ? current
              : [...current, recipeId]
          )
        }

        throw error
      } finally {
        inFlightSendsRef.current.delete(recipeId)
      }
    })()

    inFlightSendsRef.current.set(recipeId, operation)

    return operation
  }

  const updateRecipeDraft = async ({
    recipeId,
    payload,
    options,
  }: {
    recipeId: string
    payload: UpdateNeedsRevisionRecipePayload
    options?: SaveRecipeEditOptions & {requestId?: string}
  }) => {
    const updatedRecipeData = await updateNeedsRevisionRecipe({
      recipeId,
      payload,
    }, options)

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

    return updatedRecipeData
  }

  return {
    recipes,
    isLoading,
    error,
    deleteRecipes,
    submitRecipeForReview,
    updateRecipeDraft,
    uncertainSendRecipeIds,
  }
}