import {
  doc,
  runTransaction,
  serverTimestamp,
} from "@firebase/firestore"
import { db } from "../../../firebase-config"

interface ToggleSavedRecipeInput {
  currentUserId: string
  recipeId: string
  currentUsername: string
  currentProfileImage?: string
}

function getRecipeSaveNotificationId(recipeId: string, actorUserId: string) {
  return `save_${recipeId}_${actorUserId}`
}

export async function toggleSavedRecipe(input: ToggleSavedRecipeInput) {
  const savedRecipeRef = doc(
    db,
    "users",
    input.currentUserId,
    "savedRecipes",
    input.recipeId
  )

  const recipeRef = doc(db, "recipes", input.recipeId)
  const currentUserRef = doc(db, "users", input.currentUserId)

  return runTransaction(db, async (transaction) => {
    const savedRecipeSnap = await transaction.get(savedRecipeRef)
    const recipeSnap = await transaction.get(recipeRef)
    const currentUserSnap = await transaction.get(currentUserRef)

    if (!recipeSnap.exists()) {
      throw new Error("Recipe document missing.")
    }

    if (!currentUserSnap.exists()) {
      throw new Error("Current user document missing.")
    }

    const recipeData = recipeSnap.data()
    const currentUserData = currentUserSnap.data()

    const recipeOwnerId = recipeData?.userId || ""
    const recipeTitle = recipeData?.title || "your recipe"

    const currentSavesCount = Number(recipeData?.stats?.savesCount || 0)
    const currentSavedRecipesCount = Number(
      currentUserData?.stats?.savedRecipesCount || 0
    )

    const saveNotificationRef =
      recipeOwnerId && recipeOwnerId !== input.currentUserId
        ? doc(
            db,
            "users",
            recipeOwnerId,
            "notifications",
            getRecipeSaveNotificationId(input.recipeId, input.currentUserId)
          )
        : null

    if (savedRecipeSnap.exists()) {
      transaction.delete(savedRecipeRef)
      // if (saveNotificationRef) {
      //   transaction.delete(saveNotificationRef)
      // }

      transaction.set(
        recipeRef,
        {
          stats: {
            ...recipeData?.stats,
            savesCount: Math.max(0, currentSavesCount - 1),
          },
        },
        { merge: true }
      )

      transaction.set(
        currentUserRef,
        {
          stats: {
            ...currentUserData?.stats,
            savedRecipesCount: Math.max(0, currentSavedRecipesCount - 1),
          },
        },
        { merge: true }
      )

      return false
    }

    transaction.set(savedRecipeRef, {
      recipeId: input.recipeId,
      userId: input.currentUserId,
      recipeOwnerId,
      savedAt: serverTimestamp(),
    })

    if (saveNotificationRef) {
      transaction.set(
        saveNotificationRef,
        {
          type: "recipe_saved",
          recipientUserId: recipeOwnerId,
          actorUserId: input.currentUserId,
          actorUsername: input.currentUsername || "Someone",
          actorProfileImage: input.currentProfileImage || "",
          recipeId: input.recipeId,
          recipeTitle,
          message: `${input.currentUsername || "Someone"} saved ${recipeTitle}.`,
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    }

    transaction.set(
      recipeRef,
      {
        stats: {
          ...recipeData?.stats,
          savesCount: currentSavesCount + 1,
        },
      },
      { merge: true }
    )

    transaction.set(
      currentUserRef,
      {
        stats: {
          ...currentUserData?.stats,
          savedRecipesCount: currentSavedRecipesCount + 1,
        },
      },
      { merge: true }
    )

    return true
  })
}