import { HttpsError, onCall } from "firebase-functions/v2/https"
import { finalizeDailyAction, RateLimitError, reserveDailyAction } from "../services/rateLimiter.service"
import { logger } from "firebase-functions"
import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { addRecipeResubmittedNotificationToTransaction } from "./recipeRevisionNotifications.service"

const REGION = "europe-west1"

type RevisionSubmission = {
  userId: string
  recipeId: string
  requestId: string
  day: string
  action: "editRecipe"
  status: "reserved" | "completed"
  createdAt: number
  completedAt: number | null
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

function handleSubmitError(error: unknown): never {
  if (error instanceof HttpsError) {
    throw error
  }

  if (error instanceof RateLimitError) {
    switch (error.code) {
      case "limit-exceeded":
        throw new HttpsError(
          "resource-exhausted",
          error.message
        )

      case "reservation-expired":
      case "reservation-not-found":
        throw new HttpsError(
          "failed-precondition",
          error.message
        )

      default:
        throw new HttpsError(
          "invalid-argument",
          error.message
        )
    }
  }

  logger.error("Recipe revision submission failed", error)

  throw new HttpsError(
    "internal",
    "Unable to submit recipe for review."
  )
}

export const submitRecipeRevision = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to submit a recipe."
        )
      }

      const input = request.data

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

      const recipeId = requireId(input.recipeId, "recipeId")
      const requestId = requireId(input.requestId, "requestId")

      const db = getFirestore()
      const recipeRef = db.collection("recipes").doc(recipeId)
      const userRef = db.collection("users").doc(userId)

      const submissionRef = db.collection("recipeRevisionSubmissions").doc(requestId)

      // A request ID used by an edit-upload operation cannot also be used to submit a recipe for review.
      const editSessionRef = db.collection("recipeEditSessions").doc(requestId)

      const editSessionSnap = await editSessionRef.get()

      if (editSessionSnap.exists) {
        throw new HttpsError(
          "invalid-argument",
          "Request ID belongs to a recipe edit session."
        )
      }

      // Persisted result makes retries idempotent, including retries after the recipe becomes pending.
      const existingSubmission = await submissionRef.get()

      if (existingSubmission.exists) {
        const existing =
          existingSubmission.data() as RevisionSubmission

        if (
          existing.userId !== userId ||
          existing.recipeId !== recipeId ||
          existing.requestId !== requestId ||
          existing.action !== "editRecipe"
        ) {
          throw new HttpsError(
            "invalid-argument",
            "Request ID belongs to another submission."
          )
        }

        if (existing.status === "completed") {
          const daySnap = await db
            .collection("rateLimits")
            .doc(userId)
            .collection("days")
            .doc(existing.day)
            .get()

          const completed =
            daySnap.data()?.completed?.[requestId]

          if (completed?.action !== "editRecipe") {
            throw new HttpsError(
              "failed-precondition",
              "Completed submission has no rate-limit record."
            )
          }

          return {
            recipeId,
            status: "pending",
            alreadyCompleted: true,
          }
        }
      }

      // Preflight avoids reserving quota for obviously
      // invalid submissions. The same data is checked
      // again transactionally below.
      const [userSnap, recipeSnap] = await Promise.all([
        userRef.get(),
        recipeRef.get(),
      ])

      if (!userSnap.exists) {
        throw new HttpsError(
          "permission-denied",
          "User profile not found."
        )
      }

      if (
        userSnap.data()?.restrictions?.canPostRecipes === false
      ) {
        throw new HttpsError(
          "permission-denied",
          "You cannot submit recipes."
        )
      }

      if (!recipeSnap.exists) {
        throw new HttpsError(
          "not-found",
          "Recipe not found."
        )
      }

      const recipeData = recipeSnap.data()!

      if (recipeData.userId !== userId) {
        throw new HttpsError(
          "permission-denied",
          "You do not own this recipe."
        )
      }

      if (
        recipeData.status !== "draft" &&
        recipeData.status !== "needs_revision"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only drafts and recipes needing revision can be submitted."
        )
      }

      const adminSnapshot = await db.collection("users").where("admin", "==", true).get()

      const adminRefs = adminSnapshot.docs
        .filter((adminDoc) => adminDoc.id !== userId)
        .map((adminDoc) => adminDoc.ref)

      if (adminRefs.length === 0) {
        throw new HttpsError(
          "failed-precondition",
          "No administrator account is available."
        )
      }

      // Reserve one operation from the same editRecipe quota.
      // The submission record is created atomically
      // with the reservation.
      const reservation = await reserveDailyAction({
        userId,
        action: "editRecipe",
        requestId,

        performWrites: (transaction, result) => {
          transaction.create(submissionRef, {
            userId,
            recipeId,
            requestId,
            day: result.day,
            action: "editRecipe",
            status: "reserved",
            createdAt: Date.now(),
            completedAt: null,
          } satisfies RevisionSubmission)
        },
      })

      // Confirm the record is bound to this exact operation.
      const boundSubmissionSnap = await submissionRef.get()

      if (!boundSubmissionSnap.exists) {
        throw new HttpsError(
          "failed-precondition",
          "Submission record was not created."
        )
      }

      const bound =
        boundSubmissionSnap.data() as RevisionSubmission

      if (
        bound.userId !== userId ||
        bound.recipeId !== recipeId ||
        bound.requestId !== requestId ||
        bound.day !== reservation.day ||
        bound.action !== "editRecipe" ||
        bound.status !== "reserved"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Reservation belongs to another submission."
        )
      }

      let notificationAdminIds: string[] = []
      let notificationRecipeTitle = ""
      let notificationActorUsername = ""
      let notificationActorProfileImage = ""

      // finalizeDailyAction owns the rate-limit transaction.
      // All application reads happen before the first write.
      const applied = await finalizeDailyAction({
        userId,
        action: "editRecipe",
        requestId,
        day: reservation.day,

        validateBeforeWrites: async (transaction) => {
          const adminDocs = await Promise.all(
            adminRefs.map((adminRef) => transaction.get(adminRef))
          )

          const validAdminIds = adminDocs
            .filter(
              (adminDoc) =>
                adminDoc.exists &&
                adminDoc.data()?.admin === true
            )
            .map((adminDoc) => adminDoc.id)

          if (validAdminIds.length === 0) {
            throw new HttpsError(
              "failed-precondition",
              "No administrator is available to review this recipe."
            )
          }

          const [
            currentUser,
            currentRecipe,
            currentSubmission,
          ] = await Promise.all([
            transaction.get(userRef),
            transaction.get(recipeRef),
            transaction.get(submissionRef),
          ])

          if (!currentUser.exists) {
            throw new HttpsError(
              "permission-denied",
              "User profile not found."
            )
          }

          if (
            currentUser.data()?.restrictions?.canPostRecipes === false
          ) {
            throw new HttpsError(
              "permission-denied",
              "You cannot submit recipes."
            )
          }

          if (!currentRecipe.exists) {
            throw new HttpsError(
              "not-found",
              "Recipe not found."
            )
          }

          const current = currentRecipe.data()!

          if (current.userId !== userId) {
            throw new HttpsError(
              "permission-denied",
              "You do not own this recipe."
            )
          }

          if (
            current.status !== "draft" &&
            current.status !== "needs_revision"
          ) {
            throw new HttpsError(
              "failed-precondition",
              "Recipe is no longer eligible for submission."
            )
          }

          if (!currentSubmission.exists) {
            throw new HttpsError(
              "failed-precondition",
              "Submission record not found."
            )
          }

          notificationAdminIds = validAdminIds

          notificationRecipeTitle =
            typeof current.title === "string" && current.title.trim()
              ? current.title.trim()
              : "Untitled recipe"

          notificationActorUsername =
            current.author?.username ||
            current.user ||
            currentUser.data()?.username ||
            "Creator"

          notificationActorProfileImage = current.author?.profileImage || ""

          const submission = currentSubmission.data() as RevisionSubmission

          if (
            submission.userId !== userId ||
            submission.recipeId !== recipeId ||
            submission.requestId !== requestId ||
            submission.day !== reservation.day ||
            submission.action !== "editRecipe" ||
            submission.status !== "reserved"
          ) {
            throw new HttpsError(
              "failed-precondition",
              "Submission record is invalid."
            )
          }
        },

        performWrites: (transaction) => {
          transaction.update(recipeRef, {
            status: "pending",
            updatedAt: FieldValue.serverTimestamp(),

            "moderation.submittedAt":
              FieldValue.serverTimestamp(),
            "moderation.reviewedAt": null,
            "moderation.reviewedBy": null,
          })

          transaction.update(submissionRef, {
            status: "completed",
            completedAt: Date.now(),
          })

          notificationAdminIds.forEach((adminUserId) => {
            addRecipeResubmittedNotificationToTransaction(
              transaction,
              {
                recipientUserId: adminUserId,
                actorUserId: userId,
                actorUsername: notificationActorUsername,
                actorProfileImage: notificationActorProfileImage,
                recipeId,
                recipeTitle: notificationRecipeTitle,
              }
            )
          })
        },
      })

      return {
        recipeId,
        status: "pending",
        alreadyCompleted: !applied,
      }
    } catch (error) {
      return handleSubmitError(error)
    }
  }
)