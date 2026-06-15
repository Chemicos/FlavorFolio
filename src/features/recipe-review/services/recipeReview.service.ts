import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "@firebase/firestore";
import { ReviewRecipe } from "../types/recipeReview.types";
import { db } from "../../../firebase-config";
import { ReviewSectionFeedback } from "../components/RecipeReviewSectionHeader";

export type ReviewSectionKey =
  | "image"
  | "metadata"
  | "description"
  | "ingredients"
  | "steps"

export async function saveRecipeReviewFeedback({
  recipeId,
  section,
  feedback,
}: {
  recipeId: string
  section: ReviewSectionKey
  feedback: ReviewSectionFeedback
}) {
  if (!recipeId) {
    throw new Error("Recipe id is required.")
  }

  const recipeRef = doc(db, "recipes", recipeId)

  await updateDoc(recipeRef, {
    [`reviewFeedback.${section}`]: {
      message: feedback.message.trim(),
      severity: feedback.message.trim() ? feedback.severity : null,
    },
    updatedAt: serverTimestamp(),
  })
}

export async function fetchPendingRecipes(): Promise<ReviewRecipe[]> {
    const recipesQuery = query(
        collection(db, "recipes"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(30)
    )

    const snapshot = await getDocs(recipesQuery)

    return snapshot.docs.map((doc) => {
        const data = doc.data() as ReviewRecipe

        return {
            ...data,
            id: doc.id,
            recipeId: data.recipeId || doc.id,
        }
    })
}