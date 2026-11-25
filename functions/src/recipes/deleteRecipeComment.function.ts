import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { HttpsError, onCall } from "firebase-functions/v2/https"

const REGION = "europe-west1"

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

type DeleteResult = {
  commentId: string
  deletionType: "hard" | "soft" | "already-deleted"
  commentsCount: number
}

export const deleteRecipeComment = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request): Promise<DeleteResult> => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to delete comments."
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
      const commentId = requireId(input.commentId, "commentId")

      const db = getFirestore()
      const recipeRef = db.collection("recipes").doc(recipeId)
      const commentRef = recipeRef.collection("comments").doc(commentId)
      const userRef = db.collection("users").doc(userId)

      return await db.runTransaction(async (transaction) => {
        const [recipeSnap, commentSnap, userSnap] =
          await Promise.all([
            transaction.get(recipeRef),
            transaction.get(commentRef),
            transaction.get(userRef),
          ])

        if (!recipeSnap.exists || !commentSnap.exists) {
          throw new HttpsError(
            "not-found",
            "Recipe or comment not found."
          )
        }

        if (!userSnap.exists) {
          throw new HttpsError(
            "failed-precondition",
            "User profile not found."
          )
        }

        const recipe = recipeSnap.data()!
        const comment = commentSnap.data()!

        const currentCount = Number(
          recipe.stats?.commentsCount ?? 0
        )

        // Soft-deleted comments cannot be deleted twice.
        if (comment.isDeleted === true) {
          return {
            commentId,
            deletionType: "already-deleted",
            commentsCount: currentCount,
          }
        }

        const isOwner = comment.userId === userId
        const isAdmin = userSnap.data()?.admin === true

        if (!isOwner && !isAdmin) {
          throw new HttpsError(
            "permission-denied",
            "You cannot delete this comment."
          )
        }

        const parentCommentId =
          typeof comment.parentCommentId === "string" &&
          comment.parentCommentId
            ? comment.parentCommentId
            : null

        const parentRef = parentCommentId
          ? recipeRef.collection("comments").doc(parentCommentId)
          : null

        const childQuery = !parentCommentId
          ? recipeRef
              .collection("comments")
              .where("parentCommentId", "==", commentId)
              .limit(1)
          : null

        const [parentSnap, childSnap] = await Promise.all([
          parentRef ? transaction.get(parentRef) : Promise.resolve(null),
          childQuery ? transaction.get(childQuery) : Promise.resolve(null),
        ])

        if (parentRef && !parentSnap?.exists) {
          throw new HttpsError(
            "failed-precondition",
            "Parent comment not found."
          )
        }

        const nextCommentsCount = Math.max(0, currentCount - 1)

        const hasReplies =
          !parentCommentId &&
          (
            (childSnap?.size ?? 0) > 0 ||
            Number(comment.repliesCount ?? 0) > 0
          )

        if (hasReplies) {
          transaction.update(commentRef, {
            comment: "",
            userId: "",
            username: "Deleted user",
            profileImage: "",
            isDeleted: true,
            deletedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            likesCount: 0,
            dislikesCount: 0,
          })

          transaction.update(recipeRef, {
            "stats.commentsCount": nextCommentsCount,
          })

          return {
            commentId,
            deletionType: "soft",
            commentsCount: nextCommentsCount,
          }
        }

        // Hard delete: root without replies, or individual reply.
        transaction.delete(commentRef)

        if (parentRef && parentSnap?.exists) {
          const currentRepliesCount = Number(
            parentSnap.data()?.repliesCount ?? 0
          )

          transaction.update(parentRef, {
            repliesCount: Math.max(0, currentRepliesCount - 1),
            updatedAt: FieldValue.serverTimestamp(),
          })
        }

        transaction.update(recipeRef, {
          "stats.commentsCount": nextCommentsCount,
        })

        return {
          commentId,
          deletionType: "hard",
          commentsCount: nextCommentsCount,
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error
      }

      logger.error("deleteRecipeComment failed", error)

      throw new HttpsError(
        "internal",
        "Unable to delete comment."
      )
    }
  }
)