import { useCallback, useEffect, useState } from "react"
import { ProfileRecipeGridItem } from "../components/ProfileRecipeGrid"
import { fetchUserPublicRecipes, fetchUserPublishedRecipesCount } from "../services/userProfile.service"

interface UseUserProfileRecipesOptions {
  userId?: string | null
  enabled: boolean
}

export function useUserProfileRecipes({
  userId,
  enabled,
}: UseUserProfileRecipesOptions) {
  const [recipes, setRecipes] = useState<ProfileRecipeGridItem[]>([])
  const [publishedRecipesCount, setPublishedRecipesCount] = useState<number>(0)
  const [isCountLoading, setIsCountLoading] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const loadRecipes = useCallback(async () => {
    if (!userId || !enabled) {
      setRecipes([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchUserPublicRecipes(userId)

      setRecipes(result)
    } catch (error) {
      console.error("Failed to load user recipes:", error)

      setRecipes([])
      setError("Failed to load user recipes.")
    } finally {
      setIsLoading(false)
    }
  }, [userId, enabled])
  
  useEffect(() => {
    let isActive = true

    if (!userId) {
      setPublishedRecipesCount(0)
      setIsCountLoading(false)

      return () => {
        isActive = false
      }
    }

    setIsCountLoading(true)

    fetchUserPublishedRecipesCount(userId)
      .then((count) => {
        if (!isActive) return

        setPublishedRecipesCount(count)
      })
      .catch((error) => {
        if (!isActive) return

        console.error("Failed to load published recipes count:", error)

        setPublishedRecipesCount(0)
      })
      .finally(() => {
        if (!isActive) return

        setIsCountLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [userId])

  useEffect(() => {
    let isActive = true

    if (!userId || !enabled) {
      setRecipes([])
      setError(null)
      setIsLoading(false)

      return () => {
        isActive = false
      }
    }

    setIsLoading(true)
    setError(null)

    fetchUserPublicRecipes(userId)
      .then((result) => {
        if (!isActive) return

        setRecipes(result)
      })
      .catch((error) => {
        if (!isActive) return

        console.error(
          "Failed to load user recipes:",
          error
        )

        setRecipes([])
        setError(
          "Failed to load user recipes."
        )
      })
      .finally(() => {
        if (!isActive) return

        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [userId, enabled])

  return {
    recipes,
    setRecipes,
    publishedRecipesCount,
    isCountLoading,
    isLoading,
    error,
    refetchRecipes: loadRecipes,
  }
}