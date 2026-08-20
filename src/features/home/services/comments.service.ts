import { collection, doc, getDoc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp, updateDoc, where } from "@firebase/firestore"
import { ViewRecipeComment } from "../components/recipe-view-drawer/ViewRecipeCommentList"
import { db } from "../../../firebase-config"
import { formatRelativeDate } from "../utils/dateFormatters"

interface CreateRecipeCommentInput {
    recipeId: string
    userId: string
    username: string
    profileImage?: string
    comment: string
}

function getCommentNotificationId(recipeId: string, commentId: string) {
  return `comment_${recipeId}_${commentId}`
}

function getReplyNotificationId(recipeId: string, replyId: string) {
  return `reply_${recipeId}_${replyId}`
}

function getCommentReactionNotificationId(commentId: string, actorUserId: string) {
  return `reaction_${commentId}_${actorUserId}`
}

interface CreateRecipeReplyInput {
  recipeId: string
  parentCommentId: string
  replyToCommentId?: string
  userId: string
  username: string
  profileImage?: string
  comment: string
  replyToUserId?: string
  replyToUsername?: string
}

async function assertUserCanComment(userId: string) {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const userSnap = await getDoc(doc(db, "users", userId))
  if (!userSnap.exists()) {
    throw new Error("User document missing.")
  }

  const restrictions = userSnap.data()?.restrictions
  const canComment = restrictions?.canComment !== false

  if (!canComment) {
    throw new Error("COMMENT_RESTRICTED")
  }
}

export async function createRecipeComment(input: CreateRecipeCommentInput) {
  await assertUserCanComment(input.userId)

  const recipeRef = doc(db, "recipes", input.recipeId)
  const commentRef = doc(collection(db, "recipes", input.recipeId, "comments"))

  await runTransaction(db, async (transaction) => {
      const recipeSnap = await transaction.get(recipeRef)

      if (!recipeSnap.exists()) {
          throw new Error("Recipe document missing.")
      }

      const recipeData = recipeSnap.data()
      const recipeOwnerId = recipeData?.userId || ""
      const recipeTitle = recipeData?.title || "your recipe"

      const currentCommentsCount = Number(recipeData?.stats?.commentsCount || 0)

      transaction.set(commentRef, {
          comment: input.comment,
          userId: input.userId,
          username: input.username,
          profileImage: input.profileImage || "",
          parentCommentId: null,
          repliesCount: 0,
          likesCount: 0,
          dislikesCount: 0,
          edited: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      })

      if (recipeOwnerId && recipeOwnerId !== input.userId) {
          const notificationRef = doc(
              db,
              "users",
              recipeOwnerId,
              "notifications",
              getCommentNotificationId(input.recipeId, commentRef.id)
          )

          transaction.set(notificationRef, {
              type: "comment",
              recipientUserId: recipeOwnerId,
              actorUserId: input.userId,
              actorUsername: input.username || "Someone",
              actorProfileImage: input.profileImage || "",
              recipeId: input.recipeId,
              recipeTitle,
              commentId: commentRef.id,
              commentPreview:
              input.comment.length > 120
                  ? `${input.comment.slice(0, 120)}...`
                  : input.comment,
              message: `${input.username || "Someone"} commented on ${recipeTitle}.`,
              read: false,
              createdAt: serverTimestamp(),
          })
      }

      transaction.set(
          recipeRef,
          {
              stats: {
                  ...recipeData?.stats,
                  commentsCount: currentCommentsCount + 1,
              }
          },
          {merge: true}
      )
  })
}

export async function createRecipeReply(input: CreateRecipeReplyInput) {
  await assertUserCanComment(input.userId)
  
  const recipeRef = doc(db, "recipes", input.recipeId)
  const parentCommentRef = doc(
    db,
    "recipes",
    input.recipeId,
    "comments",
    input.parentCommentId
  )
  const replyRef = doc(collection(db, "recipes", input.recipeId, "comments"))

  await runTransaction(db, async (transaction) => {
    const recipeSnap = await transaction.get(recipeRef)
    const parentCommentSnap = await transaction.get(parentCommentRef)

    if (!recipeSnap.exists()) {
      throw new Error("Recipe document missing.")
    }

    if (!parentCommentSnap.exists()) {
      throw new Error("Parent comment missing.")
    }

    const recipeData = recipeSnap.data()
    const parentData = parentCommentSnap.data()

    const recipeTitle = recipeData?.title || "your recipe"
    const currentCommentsCount = Number(recipeData?.stats?.commentsCount || 0)
    const currentRepliesCount = Number(parentData?.repliesCount || 0)

    transaction.set(replyRef, {
      comment: input.comment,
      userId: input.userId,
      username: input.username,
      profileImage: input.profileImage || "",
      parentCommentId: input.parentCommentId,
      replyToUserId: input.replyToUserId || "",
      replyToUsername: input.replyToUsername || "",
      replyToCommentId: input.replyToCommentId || input.parentCommentId,
      likesCount: 0,
      dislikesCount: 0,
      edited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (input.replyToUserId && input.replyToUserId !== input.userId) {
      const notificationRef = doc(
        db,
        "users",
        input.replyToUserId,
        "notifications",
        getReplyNotificationId(input.recipeId, replyRef.id)
      )

      transaction.set(notificationRef, {
        type: "reply",
        recipientUserId: input.replyToUserId,
        actorUserId: input.userId,
        actorUsername: input.username || "Someone",
        actorProfileImage: input.profileImage || "",
        recipeId: input.recipeId,
        recipeTitle,
        commentId: input.parentCommentId,
        replyId: replyRef.id,
        replyToCommentId: input.replyToCommentId || input.parentCommentId,
        replyPreview:
          input.comment.length > 120
            ? `${input.comment.slice(0, 120)}...`
            : input.comment,
        message: `${input.username || "Someone"} replied to your comment on ${recipeTitle}.`,
        read: false,
        createdAt: serverTimestamp(),
      })
    }

    transaction.set(
      parentCommentRef,
      {
        repliesCount: currentRepliesCount + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    transaction.set(
      recipeRef,
      {
        stats: {
          ...recipeData?.stats,
          commentsCount: currentCommentsCount + 1,
        },
      },
      { merge: true }
    )
  })
}

type CommentReactionType = "like" | "dislike"

export async function toggleRecipeCommentReaction({
    recipeId,
    commentId,
    userId,
    username,
    profileImage,
    type,
}: {
    recipeId: string
    commentId: string
    userId: string
    username: string
    profileImage?: string
    type: CommentReactionType
}) {
   const recipeRef = doc(db, "recipes", recipeId)
  const commentRef = doc(db, "recipes", recipeId, "comments", commentId)

  const reactionId = `${recipeId}_${commentId}_${userId}`
  const reactionRef = doc(db, "commentReactions", reactionId)

  await runTransaction(db, async (transaction) => {
    const recipeSnap = await transaction.get(recipeRef)
    const commentSnap = await transaction.get(commentRef)
    const reactionSnap = await transaction.get(reactionRef)

    if (!recipeSnap.exists()) {
      throw new Error("Recipe document does not exist.")
    }

    if (!commentSnap.exists()) {
      throw new Error("Comment document does not exist.")
    }

    const recipeData = recipeSnap.data()
    const commentData = commentSnap.data()

    const commentOwnerId = commentData?.userId || ""
    const recipeTitle = recipeData?.title || "your recipe"
    const isReply = Boolean(commentData?.parentCommentId)

    const previousType = reactionSnap.exists()
      ? (reactionSnap.data()?.type as CommentReactionType)
      : null

    const notificationRef = doc(
      db,
      "users",
      commentOwnerId,
      "notifications",
      getCommentReactionNotificationId(commentId, userId)
    )

    if (previousType === type) {
      transaction.delete(reactionRef)

      transaction.update(commentRef, {
        [`${type}sCount`]: increment(-1),
        updatedAt: serverTimestamp(),
      })

      if (commentOwnerId && commentOwnerId !== userId) {
        transaction.delete(notificationRef)
      }

      return
    }

    if (previousType) {
      transaction.update(commentRef, {
        [`${previousType}sCount`]: increment(-1),
        [`${type}sCount`]: increment(1),
        updatedAt: serverTimestamp(),
      })
    } else {
      transaction.update(commentRef, {
        [`${type}sCount`]: increment(1),
        updatedAt: serverTimestamp(),
      })
    }

    transaction.set(
      reactionRef,
      {
        recipeId,
        commentId,
        userId,
        type,
        createdAt: reactionSnap.exists()
          ? reactionSnap.data()?.createdAt
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    if (commentOwnerId && commentOwnerId !== userId) {
      const notificationType =
        isReply
          ? type === "like"
            ? "reply_like"
            : "reply_dislike"
          : type === "like"
            ? "comment_like"
            : "comment_dislike"

      transaction.set(
        notificationRef,
        {
          type: notificationType,
          recipientUserId: commentOwnerId,
          actorUserId: userId,
          actorUsername: username || "Someone",
          actorProfileImage: profileImage || "",
          recipeId,
          recipeTitle,
          commentId,
          parentCommentId: commentData?.parentCommentId || null,
          reactionType: type,
          message: `${username || "Someone"} ${type === "like" ? "liked" : "disliked"} your ${isReply ? "reply" : "comment"} on ${recipeTitle}.`,
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    }
  })
}

export function listenToRecipeCommentReactions(
    recipeId: string,
    userId: string,
    onChange: (reactions: Record<string, CommentReactionType>) => void,
    onError?: (error: unknown) => void
) {
    const reactionsQuery = query(
        collection(db, "commentReactions"),
        where("recipeId", "==", recipeId),
        where("userId", "==", userId)
    )

    return onSnapshot(
        reactionsQuery,
        (snapshot) => {
        const reactions: Record<string, CommentReactionType> = {}

        snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data()
            reactions[data.commentId] = data.type
        })

        onChange(reactions)
        },
        (error) => {
            console.error("Error listening to comment reactions:", error)
            onError?.(error)
        }
    )
}

export function listenToRecipeComments(
    recipeId: string,
    onChange: (comments: ViewRecipeComment[]) => void,
    onError?: (error: unknown) => void
) {
    const commentsRef = collection(db, "recipes", recipeId, "comments")
    const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"))

    return onSnapshot(commentsQuery, (snapshot) => {
        const allComments: ViewRecipeComment[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data()

            return {
                id: docSnap.id,
                userId: data.userId || "",
                username: data.username || "Unknown",
                profileImage: data.profileImage || "",
                text: data.comment || "",
                createdAtLabel: formatRelativeDate(data.createdAt),
                edited: Boolean(data.edited),
                parentCommentId: data.parentCommentId || null,
                replyToUserId: data.replyToUserId || "",
                replyToUsername: data.replyToUsername || "",
                repliesCount: Number(data.repliesCount || 0),
                likesCount: Number(data.likesCount || 0),
                dislikesCount: Number(data.dislikesCount || 0),
                currentUserReaction: null,
                replies: [],
            } satisfies ViewRecipeComment
        })

        const byId = new Map(allComments.map((comment) => [comment.id, comment]))
        const rootComments: ViewRecipeComment[] = []

         allComments.forEach((comment) => {
            if (comment.parentCommentId) {
                const parent = byId.get(comment.parentCommentId)
                parent?.replies?.push(comment)
                return
            }

            rootComments.push(comment)
        })

        rootComments.forEach((comment) => {
                comment.replies = [...(comment.replies || [])].sort((a, b) => {
                return a.createdAtLabel > b.createdAtLabel ? 1 : -1
            })
        })

        onChange(rootComments)
    },
    (error) => {
        console.error("Error listening to recipe comments:", error)
        onError?.(error)
    })
}

export async function updateRecipeComment({
    recipeId,
    commentId,
    comment
}: {
    recipeId: string
    commentId: string
    comment: string
}) {
    const commentRef = doc(db, "recipes", recipeId, "comments", commentId)

    await updateDoc(commentRef, {
        comment,
        edited: true,
        updatedAt: serverTimestamp()
    })
}

export async function deleteRecipeComment({recipeId, commentId}: {recipeId: string, commentId: string}) {
    const recipeRef = doc(db, "recipes", recipeId)
    const commentRef = doc(db, "recipes", recipeId, "comments", commentId)

    await runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef)
        const commentSnap = await transaction.get(commentRef)

        if (!recipeSnap.exists()) throw new Error("Recipe document does not exist.")
        if (!commentSnap.exists()) throw new Error("Comment document does not exist.")

        const recipeData = recipeSnap.data()
        const commentData = commentSnap.data()

        const currentCommentsCount = Number(recipeData?.stats?.commentsCount || 0)
        const parentCommentId = commentData?.parentCommentId || null

        let parentCommentRef = null
        let parentCommentSnap = null

        if (parentCommentId) {
        parentCommentRef = doc(db, "recipes", recipeId, "comments", parentCommentId)
        parentCommentSnap = await transaction.get(parentCommentRef)
        }

        transaction.delete(commentRef)

        transaction.set(
        recipeRef,
        {
            stats: {
            ...recipeData.stats,
            commentsCount: Math.max(0, currentCommentsCount - 1),
            },
        },
        { merge: true }
        )

        if (parentCommentRef && parentCommentSnap?.exists()) {
        const parentData = parentCommentSnap.data()
        const currentRepliesCount = Number(parentData?.repliesCount || 0)

        transaction.set(
            parentCommentRef,
            {
            repliesCount: Math.max(0, currentRepliesCount - 1),
            updatedAt: serverTimestamp(),
            },
            { merge: true }
        )
        }
    })
}