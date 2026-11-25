import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { HttpsError, onCall } from "firebase-functions/v2/https"

const REGION = "europe-west1"
const MAX_REPLY_LENGTH = 2000

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

export const createRecipeReply = onCall(
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
          "Sign in to reply to comments."
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
      const parentCommentId = requireId(
        input.parentCommentId,
        "parentCommentId"
      )

      const replyToCommentId = requireId(
        input.replyToCommentId || parentCommentId,
        "replyToCommentId"
      )

      if (
        typeof input.comment !== "string" ||
        !input.comment.trim() ||
        input.comment.trim().length > MAX_REPLY_LENGTH
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Reply must contain 1–2000 characters."
        )
      }

      const comment = input.comment.trim()
      const db = getFirestore()

      const recipeRef = db.collection("recipes").doc(recipeId)
      const userRef = db.collection("users").doc(userId)

      const commentsRef = recipeRef.collection("comments")
      const parentRef = commentsRef.doc(parentCommentId)
      const targetRef = commentsRef.doc(replyToCommentId)
      const replyRef = commentsRef.doc()

      return await db.runTransaction(async (transaction) => {
        const [recipeSnap, userSnap, parentSnap] =
          await Promise.all([
            transaction.get(recipeRef),
            transaction.get(userRef),
            transaction.get(parentRef),
          ])

        const targetSnap =
          replyToCommentId === parentCommentId
            ? parentSnap
            : await transaction.get(targetRef)

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

        if (!parentSnap.exists || !targetSnap.exists) {
          throw new HttpsError(
            "not-found",
            "Comment not found."
          )
        }

        const recipe = recipeSnap.data()!
        const user = userSnap.data()!
        const parent = parentSnap.data()!
        const target = targetSnap.data()!

        if (
          recipe.status !== "published" ||
          recipe.visibility !== "public"
        ) {
          throw new HttpsError(
            "permission-denied",
            "Replies are unavailable for this recipe."
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
            "Your account cannot post replies."
          )
        }

        // The parent must be a top-level comment.
        if (parent.parentCommentId) {
          throw new HttpsError(
            "invalid-argument",
            "Invalid parent comment."
          )
        }

        // A reply target must belong to this thread.
        if (
          replyToCommentId !== parentCommentId &&
          target.parentCommentId !== parentCommentId
        ) {
          throw new HttpsError(
            "invalid-argument",
            "Reply target belongs to another thread."
          )
        }

        // Future soft-deleted comments cannot receive
        // new replies, but their existing replies remain.
        if (
          parent.isDeleted === true ||
          target.isDeleted === true
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Cannot reply to a deleted comment."
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

        const targetUserId =
          typeof target.userId === "string"
            ? target.userId
            : ""

        const targetUsername =
          typeof target.username === "string"
            ? target.username
            : ""

        const recipeTitle =
          typeof recipe.title === "string" &&
          recipe.title.trim()
            ? recipe.title.trim()
            : "your recipe"

        const currentCommentsCount = Number(
          recipe.stats?.commentsCount ?? 0
        )

        const currentRepliesCount = Number(
          parent.repliesCount ?? 0
        )

        transaction.create(replyRef, {
          comment,
          userId,
          username,
          profileImage,
          parentCommentId,
          replyToCommentId,
          replyToUserId: targetUserId,
          replyToUsername: targetUsername,
          repliesCount: 0,
          likesCount: 0,
          dislikesCount: 0,
          edited: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        transaction.update(parentRef, {
          repliesCount: currentRepliesCount + 1,
          updatedAt: FieldValue.serverTimestamp(),
        })

        transaction.update(recipeRef, {
          "stats.commentsCount": currentCommentsCount + 1,
        })

        if (targetUserId && targetUserId !== userId) {
          const notificationRef = db
            .collection("users")
            .doc(targetUserId)
            .collection("notifications")
            .doc(`reply_${recipeId}_${replyRef.id}`)

          transaction.create(notificationRef, {
            type: "reply",
            recipientUserId: targetUserId,
            actorUserId: userId,
            actorUsername: username,
            actorProfileImage: profileImage,
            recipeId,
            recipeTitle,
            commentId: parentCommentId,
            replyId: replyRef.id,
            replyToCommentId,
            replyPreview:
              comment.length > 120
                ? `${comment.slice(0, 120)}...`
                : comment,
            message:
              `${username} replied to your comment on ${recipeTitle}.`,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          })
        }

        return {
          replyId: replyRef.id,
          parentCommentId,
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error
      }

      logger.error("createRecipeReply failed", error)

      throw new HttpsError(
        "internal",
        "Unable to create reply."
      )
    }
  }
)