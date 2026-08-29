import { collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "@firebase/firestore";
import { CreateReelCommentInput, DeleteReelCommentInput, ReelComment, ReelCommentAuthor, UpdateReelCommentInput } from "../types/reelComment.types";
import { db } from "../../../firebase-config";

function mapReelCommentDoc(
  reelId: string,
  commentId: string,
  data: Record<string, unknown>
): ReelComment {
  return {
    id: commentId,
    reelId,
    userId: typeof data.userId === "string" ? data.userId : "",
    username: typeof data.username === "string" ? data.username : "Unknown",
    profileImage: typeof data.profileImage === "string" ? data.profileImage : "",
    text: typeof data.comment === "string" ? data.comment : "",
    edited: Boolean(data.edited),
    createdAt: data.createdAt as ReelComment["createdAt"],
    updatedAt: data.updatedAt as ReelComment["updatedAt"],
  }
}

function normalizeReelCommentText(text: string) {
  const normalizedText = text.trim()

  if (!normalizedText) {
    throw new Error("Comment cannot be empty.")
  }

  if (normalizedText.length > 500) {
    throw new Error("Comment cannot exceed 500 characters.")
  }

  return normalizedText
}

export async function fetchReelCommentAuthor(
  userId: string
): Promise<ReelCommentAuthor> {
  const userRef = doc(db, "users", userId)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    return {
      userId,
      username: "User",
      profileImage: "",
    }
  }

  const data = userSnapshot.data()

  return {
    userId,
    username:
      data.username ||
      data.displayName ||
      data.firstName ||
      "User",
    profileImage: data.profileImage || "",
  }
}

export function listenToReelComments({
  reelId,
  onChange,
  onError,
}: {
  reelId: string
  onChange: (comments: ReelComment[]) => void
  onError?: (error: unknown) => void
}) {
  const commentsRef = collection(db, "reels", reelId, "comments")

  const commentsQuery = query(
    commentsRef,
    orderBy("createdAt", "desc")
  )

  let currentComments: ReelComment[] = []
  const authorMap = new Map<string, ReelCommentAuthor>()
  const authorUnsubscribers = new Map<string, () => void>()

  const emitComments = () => {
    const enrichedComments = currentComments.map((comment) => {
      const liveAuthor = authorMap.get(comment.userId)

      if (!liveAuthor) {
        return comment
      }

      return {
        ...comment,
        username: liveAuthor.username,
        profileImage: liveAuthor.profileImage,
      }
    })

    onChange(enrichedComments)
  }

  const subscribeToAuthor = (userId: string) => {
    if (!userId) return

    if (authorUnsubscribers.has(userId)) {
      return
    }

    const userRef = doc(db, "users", userId)

    const unsubscribe = onSnapshot(
      userRef,
      (userSnapshot) => {
        if (!userSnapshot.exists()) {
          authorMap.delete(userId)
          emitComments()
          return
        }

        const data = userSnapshot.data()

        authorMap.set(userId, {
          userId,
          username:
            data.username ||
            data.displayName ||
            data.firstName ||
            "User",
          profileImage:
            data.profileImage ||
            data.profileImageUrl ||
            "",
        })

        emitComments()
      },
      (error) => {
        console.error(`Failed to listen to reel comment author ${userId}:`, error)
      }
    )

    authorUnsubscribers.set(userId, unsubscribe)
  }

  const unsubscribeComments = onSnapshot(
    commentsQuery,

    (snapshot) => {
      currentComments = snapshot.docs.map(
        (commentSnapshot) =>
          mapReelCommentDoc(
            reelId,
            commentSnapshot.id,
            commentSnapshot.data()
          )
      )

      const activeAuthorIds = new Set(
        currentComments
          .map((comment) => comment.userId)
          .filter(Boolean)
      )

      activeAuthorIds.forEach((userId) => {
        subscribeToAuthor(userId)
      })

      authorUnsubscribers.forEach(
        (unsubscribe, userId) => {
          if (activeAuthorIds.has(userId)) {
            return
          }

          unsubscribe()
          authorUnsubscribers.delete(userId)
          authorMap.delete(userId)
        }
      )

      emitComments()
    },

    (error) => {
      console.error("Failed to listen to reel comments:", error)

      onError?.(error)
    }
  )

  return () => {
    unsubscribeComments()

    authorUnsubscribers.forEach(
      (unsubscribe) => unsubscribe()
    )

    authorUnsubscribers.clear()
    authorMap.clear()
  }
}

export async function createReelComment(
  input: CreateReelCommentInput
) {
  const normalizedText = normalizeReelCommentText(input.text)

  const reelRef = doc(db, "reels", input.reelId)

  const commentRef = doc(
    collection(db, "reels", input.reelId, "comments")
  )

  await runTransaction(db, async (transaction) => {
    const reelSnapshot = await transaction.get(reelRef)

    if (!reelSnapshot.exists()) {
      throw new Error("Reel does not exist.")
    }

    const reelData = reelSnapshot.data()
    const currentCommentsCount = Number(
      reelData.commentsCount ??
        reelData.stats?.commentsCount ??
        0
    )

    transaction.set(commentRef, {
      reelId: input.reelId,
      userId: input.userId,
      username: input.username,
      profileImage: input.profileImage || "",
      comment: normalizedText,
      edited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    transaction.set(
      reelRef,
      {
        commentsCount: currentCommentsCount + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  })

  return commentRef.id
}

export async function deleteReelComment(
  input: DeleteReelCommentInput
) {
  const reelRef = doc(db, "reels", input.reelId)

  const commentRef = doc( db, "reels", input.reelId, "comments", input.commentId )

  await runTransaction(db, async (transaction) => {
    const reelSnapshot = await transaction.get(reelRef)
    const commentSnapshot = await transaction.get(commentRef)

    if (!reelSnapshot.exists()) {
      throw new Error("Reel does not exist.")
    }

    if (!commentSnapshot.exists()) {
      throw new Error("Comment does not exist.")
    }

    const commentData = commentSnapshot.data()

    if (commentData.userId !== input.currentUserId) {
      throw new Error("You cannot delete this comment.")
    }

    const reelData = reelSnapshot.data()
    const currentCommentsCount = Number(
      reelData.commentsCount ??
        reelData.stats?.commentsCount ??
        0
    )

    transaction.delete(commentRef)

    transaction.set(
      reelRef,
      {
        commentsCount: Math.max(
          0,
          currentCommentsCount - 1
        ),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  })
}

export async function updateReelComment(input: UpdateReelCommentInput) {
  const normalizedText = normalizeReelCommentText(input.text)

  const commentRef = doc(db, "reels", input.reelId, "comments", input.commentId)
  await runTransaction(db, async (transaction) => {
    const commentSnapshot = await transaction.get(commentRef)

    if (!commentSnapshot.exists()) {
      throw new Error("Comment does not exist.")
    }

    const commentData = commentSnapshot.data()

    if (commentData.userId !== input.currentUserId) {
      throw new Error("You cannot edit this comment.")
    }

    transaction.update(commentRef, {
      comment: normalizedText,
      edited: true,
      updatedAt: serverTimestamp(),
    })
  })
}
