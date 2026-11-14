import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { HttpsError, onCall } from "firebase-functions/v2/https"

const REGION = "europe-west1"

type SaveRecipeInput = {
  recipeId: string
  saved: boolean
  requestId: string
}

type SaveRecipeResult = {
  recipeId: string
  saved: boolean
  changed: boolean
  alreadyCompleted: boolean
  savesCount: number
}

function requireId(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9_-]{8,128}$/.test(value)
  ) {
    throw new HttpsError(
      "invalid-argument",
      `Invalid ${field}.`
    )
  }

  return value
}

export const setRecipeSaved = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request): Promise<SaveRecipeResult> => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to save recipes."
        )
      }

      const input = request.data as Partial<SaveRecipeInput> | null

      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new HttpsError("invalid-argument", "Invalid request body.")
      }

      const recipeId = requireId(input.recipeId, "recipeId")
      const requestId = requireId(input.requestId, "requestId")

      if (typeof input.saved !== "boolean") {
        throw new HttpsError(
          "invalid-argument",
          "saved must be a boolean."
        )
      }

      const desiredSaved = input.saved
      const db = getFirestore()

      const recipeRef = db.collection("recipes").doc(recipeId)
      const userRef = db.collection("users").doc(userId)
      const savedRef = userRef.collection("savedRecipes").doc(recipeId)

      const operationRef = db
        .collection("recipeSaveOperations")
        .doc(requestId)

      return await db.runTransaction(async (transaction) => {
        // Read the receipt first to guarantee idempotent retries.
        const existingOperation = await transaction.get(operationRef)

        if (existingOperation.exists) {
          const previous = existingOperation.data()!

          if (
            previous.userId !== userId ||
            previous.recipeId !== recipeId ||
            previous.saved !== desiredSaved
          ) {
            throw new HttpsError(
              "invalid-argument",
              "Request ID belongs to another operation."
            )
          }

          return {
            recipeId,
            saved: previous.saved,
            changed: previous.changed,
            alreadyCompleted: true,
            savesCount: previous.savesCount,
          }
        }

        // All reads must happen before any writes.
        const [recipeSnap, userSnap, savedSnap] = await Promise.all([
          transaction.get(recipeRef),
          transaction.get(userRef),
          transaction.get(savedRef),
        ])

        if (!recipeSnap.exists) {
          throw new HttpsError("not-found", "Recipe not found.")
        }

        if (!userSnap.exists) {
          throw new HttpsError(
            "failed-precondition",
            "User profile not found."
          )
        }

        const recipe = recipeSnap.data()!
        const user = userSnap.data()!

        const ownerId = recipe.userId as string

        if (!ownerId) {
          throw new HttpsError(
            "failed-precondition",
            "Recipe owner is missing."
          )
        }

        // Saving a new recipe requires public visibility.
        // Existing saved recipes can still be removed.
        if (
          desiredSaved &&
          !savedSnap.exists &&
          ownerId !== userId &&
          (
            recipe.status !== "published" ||
            recipe.visibility !== "public"
          )
        ) {
          throw new HttpsError(
            "permission-denied",
            "This recipe is not available for saving."
          )
        }

        const currentlySaved = savedSnap.exists
        const changed = currentlySaved !== desiredSaved
        const delta = desiredSaved ? 1 : -1

        const currentSavesCount = Number(
          recipe.stats?.savesCount ?? 0
        )

        let nextSavesCount = currentSavesCount

        if (changed) {
          nextSavesCount = Math.max(
            0,
            currentSavesCount + delta
          )

          if (desiredSaved) {
            transaction.create(savedRef, {
              recipeId,
              userId,
              recipeOwnerId: ownerId,
              savedAt: FieldValue.serverTimestamp(),
            })
          } else {
            transaction.delete(savedRef)
          }

          transaction.update(recipeRef, {
            "stats.savesCount": nextSavesCount,
          })

          const currentUserSavedCount = Number(
            user.stats?.savedRecipesCount ?? 0
          )

          transaction.update(userRef, {
            "stats.savedRecipesCount": Math.max(
              0,
              currentUserSavedCount + delta
            ),
          })

          if (desiredSaved && ownerId !== userId) {
            const notificationRef = db
              .collection("users")
              .doc(ownerId)
              .collection("notifications")
              .doc(`save_${recipeId}_${userId}`)

            const username =
              typeof user.username === "string" &&
              user.username.trim()
                ? user.username.trim()
                : "Someone"

            const recipeTitle =
              typeof recipe.title === "string"
                ? recipe.title
                : "your recipe"

            transaction.set(
              notificationRef,
              {
                type: "recipe_saved",
                recipientUserId: ownerId,
                actorUserId: userId,
                actorUsername: username,
                actorProfileImage: user.profileImage || "",
                recipeId,
                recipeTitle,
                message: `${username} saved ${recipeTitle}.`,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            )
          }
        }

        // Persist the result even when no state change was needed.
        transaction.create(operationRef, {
          userId,
          recipeId,
          requestId,
          saved: desiredSaved,
          changed,
          savesCount: nextSavesCount,
          createdAt: FieldValue.serverTimestamp(),
        })

        return {
          recipeId,
          saved: desiredSaved,
          changed,
          alreadyCompleted: false,
          savesCount: nextSavesCount,
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error
      }

      logger.error("setRecipeSaved failed", error)

      throw new HttpsError(
        "internal",
        "Unable to update saved recipe."
      )
    }
  }
)