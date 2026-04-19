import {
  doc,
  runTransaction,
  serverTimestamp,
} from "@firebase/firestore"
import { db } from "../../../firebase-config"

interface ToggleSavedRecipeInput {
  currentUserId: string
  recipeId: string
}

export async function toggleSavedRecipe(input: ToggleSavedRecipeInput) {
  const savedRecipeRef = doc(db, "users", input.currentUserId, "savedRecipes", input.recipeId)
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

    const currentSavesCount = Number(recipeData?.stats?.savesCount || 0)
    const currentSavedRecipesCount = Number(currentUserData?.stats?.savedRecipesCount || 0)

    if (savedRecipeSnap.exists()) {
      transaction.delete(savedRecipeRef)

      transaction.set(recipeRef, {
        stats: {
          ...recipeData?.stats,
          savesCount: Math.max(0, currentSavesCount - 1),
        },
      }, { merge: true })

      transaction.set(currentUserRef, {
        stats: {
          ...currentUserData?.stats,
          savedRecipesCount: Math.max(0, currentSavedRecipesCount - 1),
        },
      }, { merge: true })

      return false
    }

    transaction.set(savedRecipeRef, {
      recipeId: input.recipeId,
      userId: input.currentUserId,
      savedAt: serverTimestamp(),
    })

    transaction.set(recipeRef, {
      stats: {
        ...recipeData?.stats,
        savesCount: currentSavesCount + 1,
      },
    }, { merge: true })

    transaction.set(currentUserRef, {
      stats: {
        ...currentUserData?.stats,
        savedRecipesCount: currentSavedRecipesCount + 1,
      },
    }, { merge: true })

    return true
  })
}