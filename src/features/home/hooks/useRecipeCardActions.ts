import { useMemo, useRef, useState } from "react"
import type { Recipe, SavedRecipe } from "../types"
import type { CurrentUserCardData } from "../types/recipeCard.types"
import { toggleFollowUser } from "../services/social.service"
import { setRecipeSaved } from "../services/savedRecipes.service"
import { createRecipeSaveNotification } from "../services/notifications.service"


interface UseRecipeCardActionsParams {
  recipe: Recipe
  currentUser: CurrentUserCardData | null
  savedRecipes: SavedRecipe[]
  followingUserIds: string[]
  onFollowStateChange: (authorId: string, isNowFollowing: boolean) => void
  onFavoriteStateChange: (recipeId: string, isNowSaved: boolean) => void
}

export function useRecipeCardActions({
  recipe,
  currentUser,
  savedRecipes,
  followingUserIds,
  onFollowStateChange,
  onFavoriteStateChange,
}: UseRecipeCardActionsParams) {
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)

  const pendingSaveAttemptRef = useRef<{
    recipeId: string
    saved: boolean
    requestId: string
  } | null>(null)

  const isOwner = currentUser?.uid === recipe.userId

  const isFollowing = useMemo(() => {
    if (!currentUser?.uid || !recipe.userId || isOwner) return false
    return followingUserIds.includes(recipe.userId)
  }, [currentUser?.uid, recipe.userId, followingUserIds, isOwner])

  const isFavorite = useMemo(() => {
    if (!currentUser?.uid || !recipe.recipeId) return false

    return savedRecipes.some((savedRecipe) => savedRecipe.recipeId === recipe.recipeId)
  }, [currentUser?.uid, recipe.recipeId, savedRecipes])

  const handleToggleFollow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (!currentUser?.uid || !recipe.userId || isOwner || isFollowLoading) return

    try {
      setIsFollowLoading(true)

      const didFollow = await toggleFollowUser({
        currentUserId: currentUser.uid,
        authorId: recipe.userId,
        authorUsername: recipe.author?.username || "",
        authorProfileImage: recipe.author?.profileImage || "",
        currentUsername: currentUser.username || "",
        currentProfileImage: currentUser.profileImage || "",
      })

      onFollowStateChange(recipe.userId, didFollow)
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  // const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation()

  //   if (!currentUser?.uid || !recipe.recipeId || isFavoriteLoading) return

  //   try {
  //     setIsFavoriteLoading(true)

  //     const didSave = await toggleSavedRecipe({
  //       currentUserId: currentUser.uid,
  //       recipeId: recipe.recipeId,
  //       currentUsername: currentUser.username || "User",
  //       currentProfileImage: currentUser.profileImage || "",
  //     })

  //     onFavoriteStateChange(recipe.recipeId, didSave)
  //   } catch (error) {
  //     console.error("Error toggling favorite:", error)
  //   } finally {
  //     setIsFavoriteLoading(false)
  //   }
  // }

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    const recipeId = recipe.recipeId || recipe.id

    if (
      !currentUser?.uid ||
      !recipeId ||
      isFavoriteLoading
    ) {
      return
    }

    const attempt =
      pendingSaveAttemptRef.current?.recipeId === recipeId
        ? pendingSaveAttemptRef.current
        : {
            recipeId,
            saved: !isFavorite,
            requestId: crypto.randomUUID(),
          }

    pendingSaveAttemptRef.current = attempt

    try {
      setIsFavoriteLoading(true)

      const result = await setRecipeSaved(attempt)

      pendingSaveAttemptRef.current = null

      if (result.changed && isFavorite !== result.saved) {
        onFavoriteStateChange(recipeId, result.saved)
      }

      return result.saved
    } catch (error) {
      console.error("Error updating saved recipe:", error)

      // Keep the same requestId only for potentially ambiguous backend/network failures.
      const code = (error as { code?: string })?.code ?? ""

      const isAmbiguous =
        code === "functions/unavailable" ||
        code === "functions/deadline-exceeded" ||
        code === "functions/internal" ||
        code === "functions/unknown" ||
        error instanceof TypeError

      if (!isAmbiguous) {
        pendingSaveAttemptRef.current = null
      }

      throw error
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  return {
    isOwner,
    isFollowing,
    isFavorite,
    isFollowLoading,
    isFavoriteLoading,
    handleToggleFollow,
    handleToggleFavorite,
  }
}