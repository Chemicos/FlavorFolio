import { CircularProgress } from '@mui/material'
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"

import React, { useEffect } from 'react'
import { Reel } from '../types/reel.types'
import { useSnackbar } from '../../../components/layout/SnackbarProvider'
import { useReelComments } from '../hooks/useReelComments'
import { motion } from 'motion/react'

import ReelCommentInput from './ReelCommentInput'
import ReelCommentItem from './ReelCommentItem'
import { useNavigate } from 'react-router-dom'

interface ReelCommentsModalProps {
  reel: Reel
  onClose: () => void
  onCommentsCountChange?: (
    reelId: string,
    commentsCount: number
  ) => void
}

export default function ReelCommentModal({
  reel,
  onClose,
  onCommentsCountChange,
}: ReelCommentsModalProps) {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()

  const {
    comments,
    currentUserId,
    currentUserProfileImage,

    isLoading,
    isSubmitting,
    deletingCommentId,
    updatingCommentId,
    error,

    addComment,
    editComment,
    removeComment,
  } = useReelComments({ reelId: reel.reelId, onCommentsCountChange, })

  const handleAuthorProfileClick = (authorId: string) => {
    onClose()

    if (authorId === currentUserId) {
      navigate("/profile")
      return
    }

    navigate(`/users/${authorId}`)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [onClose])

  async function handleAddComment(text: string) {
    try {
      await addComment(text)

      showSnackbar("Comment published.", "success")
    } catch {
      showSnackbar("Failed to publish comment.", "error")
    }
  }

  async function handleEditComment({commentId, text,}: {
    commentId: string
    text: string
  }) {
    try {
      await editComment({
        commentId,
        text,
      })

      showSnackbar("Comment updated.", "success")
    } catch (error) {
      showSnackbar("Failed to update comment.", "error")

      throw error
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await removeComment(commentId)

      showSnackbar("Comment deleted.", "success")
    } catch {
      showSnackbar("Failed to delete comment.", "error")
    }
  }

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-label="Close comments"
        className="absolute inset-0 z-[70] cursor-default bg-[var(--overlay)] backdrop-blur-[1px]"
      />

      <div className="absolute z-[80] right-4 top-4 bottom-4 w-[min(420px,calc(100vw-32px))] xl:left-[calc(50%+231px)] xl:right-auto xl:top-1/2 xl:bottom-auto xl:h-[min(820px,calc(100%_-_3rem))] xl:w-[420px] xl:-translate-y-1/2">
        <motion.aside
          initial={{opacity: 0,x: 28,scale: 0.98,}}
          animate={{opacity: 1, x: 0, scale: 1,}}
          exit={{ opacity: 0, x: 28, scale: 0.98,}}
          transition={{duration: 0.2, ease: [0.22, 1, 0.36, 1],}}
          className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-[var(--shadow-panel)]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)]">
                {reel.author.profileImage ? (
                  <img
                    src={reel.author.profileImage}
                    alt={reel.author.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                    {reel.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Comments
                </h2>

                <p className="truncate text-xs text-[var(--text-muted)]">
                  {reel.author.username}
                </p>
              </div>

              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                {comments.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)]"
              aria-label="Close comments"
            >
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <CircularProgress
                  size={30}
                  sx={{ color: "var(--accent)" }}
                />
              </div>
            ) : error && comments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Comments could not be loaded
                </p>

                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Please close the panel and try again.
                </p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--accent)]">
                  <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 26 }} />
                </div>

                <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">
                  No comments yet
                </h3>

                <p className="mt-2 max-w-[260px] text-sm leading-6 text-[var(--text-muted)]">
                  Start the conversation and share what you think about this reel.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] py-1">
                {comments.map((comment) => (
                  <ReelCommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    isDeleting={deletingCommentId === comment.id}
                    isUpdating={updatingCommentId === comment.id}
                    onAuthorClick={handleAuthorProfileClick}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0">
            <ReelCommentInput
              profileImage={currentUserProfileImage}
              isAuthenticated={Boolean(currentUserId)}
              isSubmitting={isSubmitting}
              onSubmit={handleAddComment}
            />
          </div>
        </motion.aside>
      </div>
    </>
  )
}
