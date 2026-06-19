import { collection, getDocs, limit, orderBy, query, where } from "@firebase/firestore"
import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { db } from "../../../firebase-config"

export async function fetchNeedsRevisionRecipes(
  userId: string
): Promise<NeedsRevisionRecipe[]> {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const recipesQuery = query(
    collection(db, "recipes"),
    where("userId", "==", userId),
    where("status", "==", "needs_revision"),
    orderBy("updatedAt", "desc"),
    limit(50)
  )

  const snapshot = await getDocs(recipesQuery)

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as NeedsRevisionRecipe

    return {
      ...data,
      id: docSnap.id,
      recipeId: data.recipeId || docSnap.id,
    }
  })
}