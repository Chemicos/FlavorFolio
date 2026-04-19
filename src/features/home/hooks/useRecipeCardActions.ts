import { useMemo, useState } from "react"
import type { Recipe, SavedRecipe } from "../types"
import type { CurrentUserCardData } from "../types/recipeCard.types"
import { toggleFollowUser } from "../services/social.service"
import { toggleSavedRecipe } from "../services/savedRecipes.service"
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

  const isOwner = currentUser?.uid === recipe.userId

  const isFollowing = useMemo(() => {
    if (!currentUser?.uid || !recipe.userId || isOwner) return false
    return followingUserIds.includes(recipe.userId)
  }, [currentUser?.uid, recipe.userId, followingUserIds, isOwner])

  const isFavorite = useMemo(() => {
    // if (!currentUser?.uid || !recipe.recipeId) return false

    // return savedRecipes.some((savedRecipe) => {
    //   if (typeof savedRecipe === "string") return savedRecipe === recipe.recipeId
    //   if (savedRecipe?.recipeId) return savedRecipe.recipeId === recipe.recipeId
    //   if (savedRecipe?.id) return savedRecipe.id === recipe.recipeId
    //   return false
    // })
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

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (!currentUser?.uid || !recipe.recipeId || isFavoriteLoading) return

    try {
      setIsFavoriteLoading(true)

      const didSave = await toggleSavedRecipe({
        currentUserId: currentUser.uid,
        recipeId: recipe.recipeId,
      })

      if (didSave && recipe.userId && recipe.userId !== currentUser.uid) {
        await createRecipeSaveNotification({
          recipientUserId: recipe.userId,
          type: "recipe_saved",
          actorUserId: currentUser.uid,
          actorUsername: currentUser.username || "",
          actorProfileImage: currentUser.profileImage || "",
          recipeId: recipe.recipeId,
          recipeTitle: recipe.title || "",
          message: `User ${currentUser.username} added ${recipe.title} to their favorite recipes.`,
        })
      }

      onFavoriteStateChange(recipe.recipeId, didSave)
    } catch (error) {
      console.error("Error toggling favorite:", error)
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