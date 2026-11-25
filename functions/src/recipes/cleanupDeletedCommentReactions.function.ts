import { getFirestore } from "firebase-admin/firestore"
import { logger } from "firebase-functions"
import { onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore"

const REGION = "europe-west1"

interface CleanupInput {
  recipeId: string
  commentId: string
  commentOwnerId: string
}

async function cleanupCommentReactions({
  recipeId,
  commentId,
  commentOwnerId,
}: CleanupInput) {
  const db = getFirestore()

  const reactionsSnap = await db
    .collection("commentReactions")
    .where("commentId", "==", commentId)
    .get()

  const matchingReactions = reactionsSnap.docs.filter(
    (docSnap) => docSnap.data().recipeId === recipeId
  )

  const batchSize = 200

  for (let i = 0; i < matchingReactions.length; i += batchSize) {
    const batch = db.batch()
    const chunk = matchingReactions.slice(i, i + batchSize)

    for (const reactionDoc of chunk) {
      batch.delete(reactionDoc.ref)

      const actorUserId = reactionDoc.data().userId

      if (
        commentOwnerId &&
        typeof actorUserId === "string" &&
        actorUserId
      ) {
        const notificationRef = db
          .collection("users")
          .doc(commentOwnerId)
          .collection("notifications")
          .doc(`reaction_${commentId}_${actorUserId}`)

        batch.delete(notificationRef)
      }
    }

    await batch.commit()
  }

  logger.info("Comment reaction cleanup completed", {
    recipeId,
    commentId,
    reactionsDeleted: matchingReactions.length,
  })
}

const DOCUMENT_PATH =
  "recipes/{recipeId}/comments/{commentId}"

export const cleanupSoftDeletedCommentReactions =
  onDocumentUpdated(
    {
      document: DOCUMENT_PATH,
      region: REGION,
    },
    async (event) => {
      const before = event.data?.before.data()
      const after = event.data?.after.data()

      if (!before || !after) return

      if (
        before.isDeleted === true ||
        after.isDeleted !== true
      ) {
        return
      }

      await cleanupCommentReactions({
        recipeId: event.params.recipeId,
        commentId: event.params.commentId,
        commentOwnerId: before.userId || "",
      })
    }
  )

export const cleanupHardDeletedCommentReactions =
  onDocumentDeleted(
    {
      document: DOCUMENT_PATH,
      region: REGION,
    },
    async (event) => {
      const deleted = event.data?.data()

      if (!deleted) return

      await cleanupCommentReactions({
        recipeId: event.params.recipeId,
        commentId: event.params.commentId,
        commentOwnerId: deleted.userId || "",
      })
    }
  )