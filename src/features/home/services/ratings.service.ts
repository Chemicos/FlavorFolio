import { doc, getDoc, runTransaction, serverTimestamp } from "@firebase/firestore"
import { db, functions } from "../../../firebase-config"
import { httpsCallable } from "firebase/functions"

interface RateRecipeInput {
  recipeId: string
  userId: string
  value: number
  username: string
  profileImage: string
}

interface RateRecipeResult {
  userRating: number
  averageRating: number
  ratingsCount: number
  ratingsSum: number
}

const rateRecipeCallable = httpsCallable<
  { recipeId: string; value: number },
  RateRecipeResult
>(functions, "rateRecipe")

export async function getUserRecipeRating(
  recipeId: string,
  userId: string
): Promise<number | null> {
  const ratingRef = doc(
    db,
    "recipes",
    recipeId,
    "ratings",
    userId
  )

  const ratingSnap = await getDoc(ratingRef)

  if (!ratingSnap.exists()) {
    return null
  }

  return Number(ratingSnap.data()?.value || 0)
}

export async function rateRecipe({
  recipeId,
  value,
}: RateRecipeInput): Promise<RateRecipeResult> {
  const response = await rateRecipeCallable({
    recipeId,
    value,
  })

  return response.data
}