import { CircularProgress } from '@mui/material'
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { ReelComment } from '../types/reelComment.types'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'


interface ReelCommentItemProps {
  comment: ReelComment
  currentUserId: string | null
  isDeleting: boolean
  isUpdating: boolean
  onDelete: (commentId: string) => void
  onAuthorClick: (authorId: string) => void

  onEdit: (input: {
    commentId: string
    text: string
  }) => Promise<void>
}

function formatCommentDate(
  createdAt: ReelComment["createdAt"]
) {
  if (!createdAt) return "Just now"

  const createdAtMs = createdAt.toMillis()
  const differenceMs = Date.now() - createdAtMs

  const minutes = Math.floor(
    differenceMs / (1000 * 60)
  )

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)

  if (days < 7) return `${days}d`

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(createdAt.toDate())
}

export default function ReelCommentItem({
  comment,
  currentUserId,
  isDeleting,
  isUpdating,
  onDelete,
  onEdit,
  onAuthorClick,
}: ReelCommentItemProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(comment.text)
  const [editError, setEditError] = useState<string | null>(null)

  const isOwner = Boolean(currentUserId) && currentUserId === comment.userId

  const normalizedDraftText = draftText.trim()

  const hasChanges = normalizedDraftText !== comment.text.trim()

  const canSubmitEdit =
    normalizedDraftText.length > 0 &&
    normalizedDraftText.length <= 500 &&
    hasChanges &&
    !isUpdating

  useEffect(() => {
    setDraftText(comment.text)
  }, [comment.text])

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isEditing) return

    textareaRef.current?.focus()

    const textLength = textareaRef.current?.value.length || 0

    textareaRef.current?.setSelectionRange(textLength, textLength)
  }, [isEditing])

  const handleStartEditing = () => {
    setDraftText(comment.text)
    setEditError(null)
    setIsMenuOpen(false)
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    if (isUpdating) return

    setDraftText(comment.text)
    setEditError(null)
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    if (!canSubmitEdit) return

    try {
      setEditError(null)

      await onEdit({
        commentId: comment.id,
        text: normalizedDraftText,
      })

      setIsEditing(false)
    } catch {
      setEditError(
        "The comment could not be updated."
      )
    }
  }

  return (
    <article className="group relative flex gap-3 px-4 py-3 transition hover:bg-white/[0.025]">
      <button
        type="button"
        onClick={() => onAuthorClick(comment.userId)}
        className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.06] transition hover:border-orange-400/40 hover:ring-2 hover:ring-orange-500/10 active:scale-95"
        aria-label={`Open ${comment.username}'s profile`}
      >
        {comment.profileImage ? (
          <img
            src={comment.profileImage}
            alt={comment.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
            {comment.username.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {comment.username}
            </p>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  ref={textareaRef}
                  value={draftText}
                  disabled={isUpdating}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => {
                    setDraftText(event.target.value)

                    if (editError) {
                      setEditError(null)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Escape" &&
                      !isUpdating
                    ) {
                      handleCancelEditing()
                    }

                    if (
                      event.key === "Enter" &&
                      (event.ctrlKey || event.metaKey)
                    ) {
                      event.preventDefault()
                      handleSaveEdit()
                    }
                  }}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0b0c] px-3 py-2.5 text-sm leading-5 text-[#d7def0] outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/40 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    {editError ? (
                      <p className="text-xs text-red-300">
                        {editError}
                      </p>
                    ) : (
                      <p className="text-xs text-[#737b94]">
                        {draftText.length}/500
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleCancelEditing}
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#8f97b1] transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CloseRoundedIcon sx={{ fontSize: 15 }} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={!canSubmitEdit}
                      onClick={handleSaveEdit}
                      className="flex h-8 min-w-[70px] items-center justify-center gap-1.5 rounded-lg bg-orange-500/15 px-3 text-xs font-semibold text-orange-200 transition hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isUpdating ? (
                        <CircularProgress
                          size={14}
                          sx={{ color: "#fed7aa" }}
                        />
                      ) : (
                        <>
                          <CheckRoundedIcon
                            sx={{ fontSize: 15 }}
                          />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-[#d7def0]">
                {comment.text}
              </p>
            )}
          </div>

          {isOwner && !isEditing && (
            <div
              ref={menuRef}
              className="relative shrink-0"
            >
              <button
                type="button"
                disabled={isDeleting || isUpdating}
                onClick={() =>
                  setIsMenuOpen((previous) => !previous)
                }
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg text-[#737b94] transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
                  isMenuOpen
                    ? "bg-white/[0.06] text-white"
                    : "opacity-0 group-hover:opacity-100",
                ].join(" ")}
                aria-label="Comment actions"
                aria-expanded={isMenuOpen}
              >
                {isDeleting ? (
                  <CircularProgress
                    size={15}
                    sx={{ color: "#a8b3cf" }}
                  />
                ) : (
                  <MoreHorizRoundedIcon
                    sx={{ fontSize: 19 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{opacity: 0, y: -4, scale: 0.96,}}
                    animate={{opacity: 1, y: 0, scale: 1,}}
                    exit={{opacity: 0, y: -4, scale: 0.96,}}
                    transition={{duration: 0.14, ease: "easeOut",}}
                    className="absolute right-0 top-10 z-30 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c] p-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.6)]"
                  >
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#d7def0] transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <EditRoundedIcon sx={{ fontSize: 17 }} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        setIsMenuOpen(false)
                        onDelete(comment.id)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-[#737b94]">
            <span>
              {formatCommentDate(comment.createdAt)}
            </span>

            {comment.edited && (
              <>
                <span>•</span>
                <span>Edited</span>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
