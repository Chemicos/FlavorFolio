import { collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp, updateDoc } from "@firebase/firestore"
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

export async function createRecipeComment(input: CreateRecipeCommentInput) {
    const recipeRef = doc(db, "recipes", input.recipeId)
    const commentRef = doc(collection(db, "recipes", input.recipeId, "comments"))

    await runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef)

        if (!recipeSnap.exists()) {
           throw new Error("Recipe document missing.")
        }

        const recipeData = recipeSnap.data()
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
    const recipeRef = doc(db, "recipes", input.recipeId)
    const parentCommentRef = doc(db, "recipes", input.recipeId, "comments", input.parentCommentId)
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
    type
}: {
    recipeId: string
    commentId: string
    userId: string
    type: CommentReactionType
}) {
    const commentRef = doc(db, "recipes", recipeId, "comments", commentId)
    const reactionRef = doc(db, "recipes", recipeId, "comments", commentId, "reactions", userId)

    await runTransaction(db, async (transaction) => {
        const commentSnap = await transaction.get(commentRef)
        const reactionSnap = await transaction.get(reactionRef)

        if (!commentSnap.exists()) {
            throw new Error("Comment document does not exist.")
        }

        const previousType = reactionSnap.exists()
            ? reactionSnap.data()?.type as CommentReactionType
            : null

        if (previousType === type) {
            transaction.delete(reactionRef)

            transaction.update(commentRef, {
                [`${type}sCount`]: increment(-1),
                updatedAt: serverTimestamp(),
            })

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
                type,
                userId,
                createdAt: reactionSnap.exists()
                ? reactionSnap.data()?.createdAt
                : serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        )
    })
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