import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp } from "@firebase/firestore"
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

export function listenToRecipeComments(
    recipeId: string,
    onChange: (comments: ViewRecipeComment[]) => void,
    onError?: (error: unknown) => void
) {
    const commentsRef = collection(db, "recipes", recipeId, "comments")
    const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"))

    return onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map((docSnap) => {
            const data = docSnap.data()

            return {
                id: docSnap.id,
                userId: data.userId || "",
                username: data.username || "Unknown",
                profileImage: data.profileImage || "",
                text: data.comment || "",
                createdAtLabel: formatRelativeDate(data.createdAt),
                replies: [],
            } satisfies ViewRecipeComment
        })
        
        onChange(comments)
    },
    (error) => {
        console.error("Error listening to recipe comments:", error)
        onError?.(error)
    })
}

export async function deleteRecipeComment({recipeId, commentId}: {recipeId: string, commentId: string}) {
    const recipeRef = doc(db, "recipes", recipeId)
    const commentRef = doc(db, "recipes", recipeId, "comments", commentId)

    await runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef)

        if (!recipeSnap.exists()) {
            throw new Error("Recipe document does not exist.")
        }

        const recipeData = recipeSnap.data()
        const currentCommentsCount = Number(recipeData?.stats?.commentsCount || 0)

        transaction.delete(commentRef)

        transaction.set(
            recipeRef,
            {
                stats: {
                    ...recipeData.stats,
                    commentsCount: Math.max(0, currentCommentsCount - 1)
                }
            },
            {merge: true}
        )
    })
}