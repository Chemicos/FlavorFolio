import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { HttpsError, onCall } from "firebase-functions/v2/https"

const REGION = "europe-west1"

type Reaction = "like" | "dislike"
type DesiredReaction = Reaction | null

interface ReactionResult {
  reaction: DesiredReaction
  likesCount: number
  dislikesCount: number
  changed: boolean
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

export const setRecipeCommentReaction = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request): Promise<ReactionResult> => {
    try {
      const userId = request.auth?.uid

      if (!userId) {
        throw new HttpsError(
          "unauthenticated",
          "Sign in to react to comments."
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

      const desiredReaction: DesiredReaction = input.reaction

      if (
        desiredReaction !== "like" &&
        desiredReaction !== "dislike" &&
        desiredReaction !== null
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid reaction."
        )
      }

      const db = getFirestore()

      const recipeRef = db.collection("recipes").doc(recipeId)
      const commentRef = recipeRef.collection("comments").doc(commentId)
      const userRef = db.collection("users").doc(userId)

      const reactionRef = db
        .collection("commentReactions")
        .doc(`${recipeId}_${commentId}_${userId}`)

      return await db.runTransaction(async (transaction) => {
        const [
          recipeSnap,
          commentSnap,
          userSnap,
          reactionSnap,
        ] = await Promise.all([
          transaction.get(recipeRef),
          transaction.get(commentRef),
          transaction.get(userRef),
          transaction.get(reactionRef),
        ])

        if (!recipeSnap.exists) {
          throw new HttpsError(
            "not-found",
            "Recipe not found."
          )
        }

        if (!commentSnap.exists) {
          throw new HttpsError(
            "not-found",
            "Comment not found."
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
        const user = userSnap.data()!

        if (
          recipe.status !== "published" ||
          recipe.visibility !== "public"
        ) {
          throw new HttpsError(
            "permission-denied",
            "Reactions are unavailable for this recipe."
          )
        }

        if (comment.isDeleted === true) {
          throw new HttpsError(
            "failed-precondition",
            "Cannot react to a deleted comment."
          )
        }

        const commentOwnerId =
          typeof comment.userId === "string"
            ? comment.userId
            : ""

        if (!commentOwnerId) {
          throw new HttpsError(
            "failed-precondition",
            "Comment owner not found."
          )
        }

        const previousReaction = reactionSnap.exists
          ? reactionSnap.data()?.type
          : null

        if (
          previousReaction !== null &&
          previousReaction !== "like" &&
          previousReaction !== "dislike"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Invalid existing reaction."
          )
        }

        const currentLikes = Number(comment.likesCount ?? 0)
        const currentDislikes = Number(comment.dislikesCount ?? 0)

        if (
          !Number.isSafeInteger(currentLikes) ||
          !Number.isSafeInteger(currentDislikes) ||
          currentLikes < 0 ||
          currentDislikes < 0
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Invalid comment reaction counters."
          )
        }

        if (previousReaction === desiredReaction) {
          return {
            reaction: desiredReaction,
            likesCount: currentLikes,
            dislikesCount: currentDislikes,
            changed: false,
          }
        }

        let nextLikes = currentLikes
        let nextDislikes = currentDislikes

        if (previousReaction === "like") nextLikes--
        if (previousReaction === "dislike") nextDislikes--

        if (desiredReaction === "like") nextLikes++
        if (desiredReaction === "dislike") nextDislikes++

        if (nextLikes < 0 || nextDislikes < 0) {
          throw new HttpsError(
            "failed-precondition",
            "Reaction counters are inconsistent."
          )
        }

        const notificationRef = db
          .collection("users")
          .doc(commentOwnerId)
          .collection("notifications")
          .doc(`reaction_${commentId}_${userId}`)
          
        if (desiredReaction === null) {
          transaction.delete(reactionRef)
        } else if (reactionSnap.exists) {
          transaction.update(reactionRef, {
            type: desiredReaction,
            updatedAt: FieldValue.serverTimestamp(),
          })
        } else {
          transaction.create(reactionRef, {
            recipeId,
            commentId,
            userId,
            type: desiredReaction,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
        }

        transaction.update(commentRef, {
          likesCount: nextLikes,
          dislikesCount: nextDislikes,
          updatedAt: FieldValue.serverTimestamp(),
        })

        if (commentOwnerId !== userId) {
          if (desiredReaction === null) {
            transaction.delete(notificationRef)
          } else {
            const username =
              typeof user.username === "string" &&
              user.username.trim()
                ? user.username.trim()
                : "Someone"

            const profileImage =
              typeof user.profileImage === "string"
                ? user.profileImage
                : ""

            const recipeTitle =
              typeof recipe.title === "string" &&
              recipe.title.trim()
                ? recipe.title.trim()
                : "your recipe"

            const isReply = Boolean(comment.parentCommentId)

            const notificationType = isReply
              ? desiredReaction === "like"
                ? "reply_like"
                : "reply_dislike"
              : desiredReaction === "like"
                ? "comment_like"
                : "comment_dislike"

            transaction.set(
              notificationRef,
              {
                type: notificationType,
                recipientUserId: commentOwnerId,
                actorUserId: userId,
                actorUsername: username,
                actorProfileImage: profileImage,
                recipeId,
                recipeTitle,
                commentId,
                parentCommentId: comment.parentCommentId || null,
                reactionType: desiredReaction,
                message:
                  `${username} ${desiredReaction === "like" ? "liked" : "disliked"} your ${isReply ? "reply" : "comment"} on ${recipeTitle}.`,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            )
          }
        }

        return {
          reaction: desiredReaction,
          likesCount: nextLikes,
          dislikesCount: nextDislikes,
          changed: true,
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error
      }

      logger.error("setRecipeCommentReaction failed", error)

      throw new HttpsError(
        "internal",
        "Unable to update comment reaction."
      )
    }
  }
)