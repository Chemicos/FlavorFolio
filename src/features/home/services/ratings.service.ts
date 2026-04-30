import { doc, getDoc, runTransaction, serverTimestamp } from "@firebase/firestore"
import { db } from "../../../firebase-config"

interface RateRecipeInput {
  recipeId: string
  userId: string
  value: number
}

export async function getUserRecipeRating(recipeId: string, userId: string) {
    const ratingRef = doc(db, "recipes", recipeId, "ratings", userId)
    const ratingSnap = await getDoc(ratingRef)

    if (!ratingSnap.exists()) return null

    return Number(ratingSnap.data()?.value || 0)
}

export async function rateRecipe({recipeId, userId, value}: RateRecipeInput) {
    const recipeRef = doc(db, "recipes", recipeId)
    const ratingRef = doc(db, "recipes", recipeId, "ratings", userId)

    return runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef)
        const ratingSnap = await transaction.get(ratingRef)

        if (!recipeSnap.exists()) {
            throw new Error("Recipe document missing.")
        }

        const recipeData = recipeSnap.data()
        const currentStats = recipeData?.stats || {}
        
        const currentRatingsCount = Number(currentStats.ratingsCount || 0)
        const currentRatingsSum = Number(currentStats.ratingsSum || 0)

        const previousValue = ratingSnap.exists() 
            ? Number(ratingSnap.data()?.value || 0) : null

        const nextRatingsCount = previousValue === null 
            ? currentRatingsCount + 1 : currentRatingsCount

        const nextRatingsSum = previousValue === null 
            ? currentRatingsSum + value : currentRatingsSum - previousValue + value

        const nextAverageRating = nextRatingsCount
            ? nextRatingsSum / nextRatingsCount : 0

        transaction.set(
            ratingRef,
            {
                userId,
                value,
                updatedAt: serverTimestamp(),
                createdAt: ratingSnap.exists()
                ? ratingSnap.data()?.createdAt || serverTimestamp()
                : serverTimestamp(),
            },
            { merge: true }
        )

        transaction.set(
            recipeRef,
            {
                stats: {
                ...currentStats,
                ratingsCount: nextRatingsCount,
                ratingsSum: nextRatingsSum,
                averageRating: nextAverageRating,
                },
            },
            { merge: true }
        )

        return {
            userRating: value,
            averageRating: nextAverageRating,
            ratingsCount: nextRatingsCount,
            ratingsSum: nextRatingsSum
        }
    })
}