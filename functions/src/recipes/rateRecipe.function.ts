import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { HttpsError, onCall } from "firebase-functions/v2/https"

const REGION = "europe-west1"

interface RateRecipeInput {
  recipeId: string
  value: number
}

interface RateRecipeResult {
  userRating: number
  averageRating: number
  ratingsCount: number
  ratingsSum: number
}

function requireRecipeId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9_-]{8,128}$/.test(value)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid recipeId."
    )
  }

  return value
}

export const rateRecipe = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request): Promise<RateRecipeResult> => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to rate recipes."
        )
      }

      const input = request.data as Partial<RateRecipeInput> | null

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input)
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid request body."
        )
      }

      const recipeId = requireRecipeId(input.recipeId)
      const value = input.value

      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Rating must be an integer between 1 and 5."
        )
      }

      const db = getFirestore()

      const recipeRef = db.collection("recipes").doc(recipeId)
      const ratingRef = recipeRef.collection("ratings").doc(userId)
      const userRef = db.collection("users").doc(userId)

      return await db.runTransaction(async (transaction) => {
        // All reads must happen before writes.
        const [recipeSnap, ratingSnap, userSnap] = await Promise.all([
          transaction.get(recipeRef),
          transaction.get(ratingRef),
          transaction.get(userRef),
        ])

        if (!recipeSnap.exists) {
          throw new HttpsError(
            "not-found",
            "Recipe not found."
          )
        }

        if (!userSnap.exists) {
          throw new HttpsError(
            "failed-precondition",
            "User profile not found."
          )
        }

        const recipe = recipeSnap.data()!
        const user = userSnap.data()!

        // Ratings are available for published, public recipes.
        if (
          recipe.status !== "published" ||
          recipe.visibility !== "public"
        ) {
          throw new HttpsError(
            "permission-denied",
            "This recipe is not available for rating."
          )
        }

        const previousValue = ratingSnap.exists
          ? Number(ratingSnap.data()?.value)
          : null

        const currentStats = recipe.stats || {}

        const currentCount = Number(
          currentStats.ratingsCount ?? 0
        )

        const currentSum = Number(
          currentStats.ratingsSum ?? 0
        )

        // Repeating the same rating changes nothing.
        if (previousValue === value) {
          return {
            userRating: value,
            averageRating:
              Number(currentStats.averageRating ?? 0),
            ratingsCount: currentCount,
            ratingsSum: currentSum,
          }
        }

        const nextCount =
          previousValue === null
            ? currentCount + 1
            : currentCount

        const nextSum =
          previousValue === null
            ? currentSum + value
            : currentSum - previousValue + value

        const nextAverage =
          nextCount > 0 ? nextSum / nextCount : 0

        if (ratingSnap.exists) {
          transaction.update(ratingRef, {
            value,
            updatedAt: FieldValue.serverTimestamp(),
          })
        } else {
          transaction.create(ratingRef, {
            userId,
            value,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
        }

        transaction.update(recipeRef, {
          "stats.ratingsCount": nextCount,
          "stats.ratingsSum": nextSum,
          "stats.averageRating": nextAverage,
        })

        const ownerId = recipe.userId

        if (
          typeof ownerId === "string" &&
          ownerId &&
          ownerId !== userId
        ) {
          const notificationRef = db
            .collection("users")
            .doc(ownerId)
            .collection("notifications")
            .doc(`rating_${recipeId}_${userId}`)

          const username =
            typeof user.username === "string" &&
            user.username.trim()
              ? user.username.trim()
              : "Someone"

          const recipeTitle =
            typeof recipe.title === "string" &&
            recipe.title.trim()
              ? recipe.title.trim()
              : "your recipe"

          transaction.set(
            notificationRef,
            {
              type: "rating",
              recipientUserId: ownerId,
              actorUserId: userId,
              actorUsername: username,
              actorProfileImage: user.profileImage || "",
              recipeId,
              recipeTitle,
              ratingValue: value,
              message: `${username} rated ${recipeTitle} ${value} stars.`,
              read: false,
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
        }

        return {
          userRating: value,
          averageRating: nextAverage,
          ratingsCount: nextCount,
          ratingsSum: nextSum,
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error
      }

      logger.error("rateRecipe failed", error)

      throw new HttpsError(
        "internal",
        "Unable to rate recipe."
      )
    }
  }
)