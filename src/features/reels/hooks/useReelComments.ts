import { useCallback, useEffect, useState } from "react"
import { ReelComment, ReelCommentAuthor } from "../types/reelComment.types"
import { getAuth, onAuthStateChanged, User } from "firebase/auth"
import { createReelComment, deleteReelComment, fetchReelCommentAuthor, listenToReelComments, updateReelComment } from "../services/reelComments.service"

interface UseReelCommentsOptions {
  reelId: string | null
  onCommentsCountChange?: (
    reelId: string,
    commentsCount: number
  ) => void
}

export function useReelComments({
  reelId,
  onCommentsCountChange,
}: UseReelCommentsOptions) {
  const [comments, setComments] = useState<ReelComment[]>([])
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [commentAuthor, setCommentAuthor] = useState<ReelCommentAuthor | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
    })
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCommentAuthor() {
      if (!authUser?.uid) {
        setCommentAuthor(null)
        return
      }

      try {
        const author = await fetchReelCommentAuthor(
          authUser.uid
        )

        if (isMounted) {
          setCommentAuthor(author)
        }
      } catch (error) {
        console.error(
          "Failed to load current comment author:",
          error
        )

        if (isMounted) {
          setCommentAuthor({
            userId: authUser.uid,
            username:
              authUser.displayName ||
              authUser.email?.split("@")[0] ||
              "User",
            profileImage: authUser.photoURL || "",
          })
        }
      }
    }

    loadCommentAuthor()

    return () => {
      isMounted = false
    }
  }, [authUser])

  useEffect(() => {
    if (!reelId) {
      setComments([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const unsubscribe = listenToReelComments({
      reelId,
      onChange: (nextComments) => {
        setComments(nextComments)
        setIsLoading(false)

        onCommentsCountChange?.(
          reelId,
          nextComments.length
        )
      },
      onError: () => {
        setError("Failed to load comments.")
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [reelId, onCommentsCountChange])

  const addComment = useCallback(
    async (text: string) => {
      if (!reelId) {
        throw new Error("No reel selected.")
      }

      if (!authUser?.uid || !commentAuthor) {
        throw new Error(
          "You must be signed in to comment."
        )
      }

      try {
        setIsSubmitting(true)
        setError(null)

        await createReelComment({
          reelId,
          userId: authUser.uid,
          username: commentAuthor.username,
          profileImage: commentAuthor.profileImage,
          text,
        })
      } catch (error) {
        console.error(
          "Failed to create reel comment:",
          error
        )

        setError("Failed to publish comment.")
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [reelId, authUser, commentAuthor]
  )

  const editComment = useCallback(
    async ({
      commentId,
      text,
    }: {
      commentId: string
      text: string
    }) => {
      if (!reelId) {
        throw new Error("No reel selected.")
      }

      if (!authUser?.uid) {
        throw new Error(
          "You must be signed in to edit comments."
        )
      }

      try {
        setUpdatingCommentId(commentId)
        setError(null)

        await updateReelComment({
          reelId,
          commentId,
          currentUserId: authUser.uid,
          text,
        })
      } catch (error) {
        console.error(
          "Failed to update reel comment:",
          error
        )

        setError("Failed to update comment.")
        throw error
      } finally {
        setUpdatingCommentId(null)
      }
    },
    [reelId, authUser]
  )

  const removeComment = useCallback(
    async (commentId: string) => {
      if (!reelId) {
        throw new Error("No reel selected.")
      }

      if (!authUser?.uid) {
        throw new Error(
          "You must be signed in to delete comments."
        )
      }

      try {
        setDeletingCommentId(commentId)
        setError(null)

        await deleteReelComment({
          reelId,
          commentId,
          currentUserId: authUser.uid,
        })
      } catch (error) {
        console.error(
          "Failed to delete reel comment:",
          error
        )

        setError("Failed to delete comment.")
        throw error
      } finally {
        setDeletingCommentId(null)
      }
    },
    [reelId, authUser]
  )

  return {
    comments,
    currentUserId: authUser?.uid || null,
    currentUserProfileImage: commentAuthor?.profileImage || "",

    isLoading,
    isSubmitting,
    deletingCommentId,
    updatingCommentId,
    error,

    addComment,
    editComment,
    removeComment,
  }
}