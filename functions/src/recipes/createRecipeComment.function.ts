import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { HttpsError, onCall } from "firebase-functions/v2/https"

const REGION = "europe-west1"
const MAX_COMMENT_LENGTH = 2000

export const createRecipeComment = onCall(
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
          "Sign in to comment."
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

      const recipeId = input.recipeId
      const comment = input.comment

      if (
        typeof recipeId !== "string" ||
        !/^[a-zA-Z0-9_-]{8,128}$/.test(recipeId)
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid recipeId."
        )
      }

      if (
        typeof comment !== "string" ||
        !comment.trim() ||
        comment.trim().length > MAX_COMMENT_LENGTH
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Comment must contain 1–2000 characters."
        )
      }

      const trimmedComment = comment.trim()

      const db = getFirestore()

      const recipeRef = db.collection("recipes").doc(recipeId)
      const userRef = db.collection("users").doc(userId)

      const commentRef = recipeRef.collection("comments").doc()

      const result = await db.runTransaction(async (transaction) => {
        const [recipeSnap, userSnap] = await Promise.all([
          transaction.get(recipeRef),
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

        if (
          recipe.status !== "published" ||
          recipe.visibility !== "public"
        ) {
          throw new HttpsError(
            "permission-denied",
            "Comments are unavailable for this recipe."
          )
        }

        if (
          recipe.allowComments === false ||
          recipe.commentsEnabled === false
        ) {
          throw new HttpsError(
            "permission-denied",
            "Comments are disabled for this recipe."
          )
        }

        if (user.restrictions?.canComment === false) {
          throw new HttpsError(
            "permission-denied",
            "Your account cannot post comments."
          )
        }

        const username =
          typeof user.username === "string" &&
          user.username.trim()
            ? user.username.trim()
            : "Unknown"

        const profileImage =
          typeof user.profileImage === "string"
            ? user.profileImage
            : ""

        const ownerId = recipe.userId

        const recipeTitle =
          typeof recipe.title === "string" &&
          recipe.title.trim()
            ? recipe.title.trim()
            : "your recipe"

        const currentCount = Number(
          recipe.stats?.commentsCount ?? 0
        )

        transaction.create(commentRef, {
          comment: trimmedComment,
          userId,
          username,
          profileImage,
          parentCommentId: null,
          repliesCount: 0,
          likesCount: 0,
          dislikesCount: 0,
          edited: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        transaction.update(recipeRef, {
          "stats.commentsCount": currentCount + 1,
        })

        if (
          typeof ownerId === "string" &&
          ownerId &&
          ownerId !== userId
        ) {
          const notificationRef = db
            .collection("users")
            .doc(ownerId)
            .collection("notifications")
            .doc(`comment_${recipeId}_${commentRef.id}`)

          transaction.create(notificationRef, {
            type: "comment",
            recipientUserId: ownerId,
            actorUserId: userId,
            actorUsername: username,
            actorProfileImage: profileImage,
            recipeId,
            recipeTitle,
            commentId: commentRef.id,
            commentPreview:
              trimmedComment.length > 120
                ? `${trimmedComment.slice(0, 120)}...`
                : trimmedComment,
            message: `${username} commented on ${recipeTitle}.`,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          })
        }

        return {
          commentId: commentRef.id,
        }
      })

      return result
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error
      }

      logger.error("createRecipeComment failed", error)

      throw new HttpsError(
        "internal",
        "Unable to create comment."
      )
    }
  }
)