import { useCallback, useEffect, useState } from "react"
import { ProfileRecipeGridItem } from "../components/ProfileRecipeGrid"
import { deleteProfileRecipe, fetchMyProfileRecipes, fetchMySavedProfileRecipes, resubmitProfileRecipe, setProfileRecipeVisibility } from "../services/profileRecipes.service"

export function useMyProfileRecipes(userId?: string | null) {
  const [recipes, setRecipes] = useState<ProfileRecipeGridItem[]>([])
  const [savedRecipes, setSavedRecipes] = useState<ProfileRecipeGridItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRecipes = useCallback(async () => {
    if (!userId) {
      setRecipes([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchMyProfileRecipes(userId)
      setRecipes(result)
    } catch (err) {
      console.error("Failed to fetch profile recipes:", err)
      setError("Failed to load profile recipes.")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let isMounted = true

    async function run() {
      if (!userId) {
        if (isMounted) {
          setRecipes([])
          setSavedRecipes([])
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await fetchMyProfileRecipes(userId)
        const savedResult = await fetchMySavedProfileRecipes(userId)

        if (isMounted) {
          setRecipes(result)
          setSavedRecipes(savedResult)
        }
      } catch (err) {
        console.error("Failed to fetch profile recipes:", err)

        if (isMounted) {
          setError("Failed to load profile recipes.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [userId])

  const deleteRecipe = async (recipeId: string) => {
    setIsActionLoading(true)

    try {
      await deleteProfileRecipe(recipeId)

      setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))
    } finally {
      setIsActionLoading(false)
    }
  }

  const resubmitRecipe = async (recipeId: string) => {
    setIsActionLoading(true)

    try {
      await resubmitProfileRecipe(recipeId)

      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId
            ? {
                ...recipe,
                status: "pending",
              }
            : recipe
        )
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  const changeRecipeVisibility = async ({
    recipeId,
    visibility,
  }: {
    recipeId: string
    visibility: "public" | "private"
  }) => {
    setIsActionLoading(true)

    try {
      await setProfileRecipeVisibility({ recipeId, visibility })
    } finally {
      setIsActionLoading(false)
    }
  }

  return {
    recipes,
    savedRecipes,
    isLoading,
    isActionLoading,
    error,
    refetchRecipes: loadRecipes,
    deleteRecipe,
    resubmitRecipe,
    changeRecipeVisibility,
    setRecipes,
  }
}