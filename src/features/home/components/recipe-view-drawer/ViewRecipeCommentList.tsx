import { useEffect, useRef, useState } from "react"

import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded"
import ThumbDownRoundedIcon from "@mui/icons-material/ThumbDownRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { AnimatePresence, motion } from "motion/react"
import { CircularProgress } from "@mui/material"

export interface ViewRecipeComment {
  id: string
  userId?: string
  username: string
  profileImage?: string
  text: string
  createdAtLabel?: string
  edited?: boolean
  parentCommentId?: string | null
  replyToUserId?: string
  replyToUsername?: string
  repliesCount?: number
  likesCount?: number
  dislikesCount?: number
  currentUserReaction?: "like" | "dislike" | null
  replies?: ViewRecipeComment[]
}

interface ViewRecipeCommentListProps {
    comments?: ViewRecipeComment[]
    currentUserId?: string
    editingCommentId?: string | null
    isUpdatingComment?: boolean
    isSubmittingReply?: boolean
    replyingCommentId?: string | null
    onStartReplyComment?: (comment: ViewRecipeComment) => void
    onCancelReplyComment?: () => void
    onReplyComment?: (comment: ViewRecipeComment, value: string) => void
    onToggleCommentReaction?: (comment: ViewRecipeComment, type: "like" | "dislike") => void
    onStartEditComment?: (comment: ViewRecipeComment) => void
    onCancelEditComment?: () => void
    onUpdateComment?: (comment: ViewRecipeComment, value: string) => void
    onDeleteComment?: (comment: ViewRecipeComment) => void
    onAuthorClick?: (userId: string) => void
    onBlockUser?: (user: {
    userId: string
    username: string
    profileImage?: string
    }) => void
    blockedUserIds?: string[]
    blockedByUserIds?: string[]
}

export default function ViewRecipeCommentList({ 
    comments = [], 
    currentUserId, 
    editingCommentId,
    isUpdatingComment,
    isSubmittingReply,
    replyingCommentId,
    onStartReplyComment,
    onCancelReplyComment,
    onReplyComment,
    onToggleCommentReaction,
    onStartEditComment,
    onCancelEditComment,
    onUpdateComment,
    onDeleteComment,
    onAuthorClick,
    onBlockUser,
    blockedUserIds = [],
    blockedByUserIds = [],
}: ViewRecipeCommentListProps) {
    const hiddenUserIds = new Set([...blockedUserIds, ...blockedByUserIds])
    const visibleComments = comments
        .filter((comment) => !comment.userId || !hiddenUserIds.has(comment.userId))
        .map((comment) => ({
            ...comment,
            replies: (comment.replies || []).filter(
                (reply) => !reply.userId || !hiddenUserIds.has(reply.userId)
            ),
    }))

    if (!visibleComments.length) {
        return (
          <p className="text-sm text-[var(--text-muted)] text-center">
            No comments yet. Be the first to share your thoughts.
          </p>
        )
    }    

    return (
       <div className="flex flex-col gap-8">
            {visibleComments.map((comment) => (
                <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    currentUserId={currentUserId}
                    replyingCommentId={replyingCommentId}
                    editingCommentId={editingCommentId}
                    isReplying={replyingCommentId === comment.id}
                    isSubmittingReply={isSubmittingReply}
                    onReplyComment={onReplyComment}
                    onStartReplyComment={onStartReplyComment}
                    onCancelReplyComment={onCancelReplyComment}
                    onToggleCommentReaction={onToggleCommentReaction}
                    isEditing={editingCommentId === comment.id}
                    isUpdatingComment={isUpdatingComment}
                    onStartEditComment={onStartEditComment}
                    onCancelEditComment={onCancelEditComment}
                    onUpdateComment={onUpdateComment}
                    onDeleteComment={onDeleteComment} 
                    onAuthorClick={onAuthorClick}
                    onBlockUser={onBlockUser}
                    blockedUserIds={blockedUserIds}
                    blockedByUserIds={blockedByUserIds}
                />
            ))}
        </div> 
    )
}

function renderCommentText(comment: ViewRecipeComment) {
    const mention = comment.replyToUsername ? `@${comment.replyToUsername}` : null

    if (!mention || !comment.text.startsWith(mention)) {
        return comment.text
    }

    const rest = comment.text.slice(mention.length)

    return (
        <>
            <span className="font-semibold text-[var(--accent)]">{mention}</span>
            <span>{rest}</span>
        </>
    )
}

function CommentItem({
    comment, 
    currentUserId,
    replyingCommentId,
    editingCommentId,
    isReply = false,
    isReplying = false,
    isSubmittingReply = false,
    onReplyComment,
    onStartReplyComment,
    onCancelReplyComment,
    onToggleCommentReaction,
    isEditing = false,
    isUpdatingComment = false,
    onStartEditComment,
    onCancelEditComment,
    onUpdateComment,
    onDeleteComment,
    onAuthorClick,
    onBlockUser,
    blockedUserIds = [],
    blockedByUserIds = [],
}: {
    comment: ViewRecipeComment 
    currentUserId?: string
    replyingCommentId?: string | null
    editingCommentId?: string | null
    isReply?: boolean
    isReplying?: boolean
    isSubmittingReply?: boolean
    onCancelReplyComment?: () => void
    onStartReplyComment?: (comment: ViewRecipeComment) => void
    onReplyComment?: (comment: ViewRecipeComment, value: string) => void
    onToggleCommentReaction?: (comment: ViewRecipeComment, type: "like" | "dislike") => void
    isEditing?: boolean
    isUpdatingComment?: boolean
    onStartEditComment?: (comment: ViewRecipeComment) => void
    onCancelEditComment?: () => void
    onUpdateComment?: (comment: ViewRecipeComment, value: string) => void
    onDeleteComment?: (comment: ViewRecipeComment) => void
    onAuthorClick?: (userId: string) => void
    onBlockUser?: (user: {
        userId: string
        username: string
        profileImage?: string
    }) => void
    blockedUserIds?: string[]
    blockedByUserIds?: string[]
}) {
    const hiddenUserIds = new Set([...blockedUserIds, ...blockedByUserIds])

    const isOwnComment = Boolean(currentUserId && comment.userId === currentUserId)
    const [showReplies, setShowReplies] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const menuRef = useRef<HTMLDivElement | null>(null)

    const [replyValue, setReplyValue] = useState("")
    const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null)
    const replies = (comment.replies || []).filter(
        (reply) => !reply.userId || !hiddenUserIds.has(reply.userId)
    )
    const hasReplies = replies.length > 0
    const replyMention = `@${comment.username} `
    const hasReplyText = replyValue.trim() !== replyMention.trim()
    const canReply = Boolean(currentUserId && comment.userId !== currentUserId)
    const isLiked = comment.currentUserReaction === "like"
    const isDisliked = comment.currentUserReaction === "dislike"

    const [editValue, setEditValue] = useState(comment.text)

    useEffect(() => {
        if (!isReplying) {
            setReplyValue("")
            return
        }

        const mention = `@${comment.username} `

        setReplyValue((prev) => {
            if (prev.trim()) return prev
            return mention
        })

        const timeoutId = window.setTimeout(() => {
            replyTextareaRef.current?.focus()
            replyTextareaRef.current?.setSelectionRange(mention.length, mention.length)
        }, 120)

        return () => window.clearTimeout(timeoutId)
    }, [isReplying, comment.username])

    useEffect(() => {
        if (!isEditing) {
            setEditValue(comment.text)
        }
    }, [isEditing, comment.text])

    useEffect(() => {
        if (!isMenuOpen) return

        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current) return

            if (!menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        document.addEventListener("pointerdown", handlePointerDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
        }
    }, [isMenuOpen])

    return (
        <div className={isReply ? "ml-2" : ""}>
            <div className="flex items-start gap-4">
                <button
                    type="button"
                    disabled={!comment.userId}
                    onClick={() => {
                        if (!comment.userId) return
                        onAuthorClick?.(comment.userId)
                    }}
                    className={[
                        "flex shrink-0 items-start gap-4 rounded-lg text-left transition",
                        comment.userId ? "hover:bg-[var(--hover)] active:scale-[0.99]" : "cursor-default",
                    ].join(" ")}
                    >
                    <div
                        className={[
                            "shrink-0 overflow-hidden bg-[var(--surface-muted)]",
                            isReply ? "h-9 w-9 rounded-lg" : "h-11 w-11 rounded-lg",
                        ].join(" ")}
                    >
                        {comment.profileImage ? (
                        <img
                            src={comment.profileImage}
                            alt={comment.username}
                            className="h-full w-full object-cover"
                        />
                        ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
                            {comment.username.charAt(0).toUpperCase()}
                        </div>
                        )}
                    </div>
                    </button>

                <div className="min-w-0 flex-1">
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                            <button
                                type="button"
                                disabled={!comment.userId}
                                onClick={() => {
                                    if (!comment.userId) return
                                    onAuthorClick?.(comment.userId)
                                }}
                                className="truncate text-sm font-bold text-[var(--text-primary)] transition hover:text-[var(--accent-text)] disabled:hover:text-[var(--text-primary)]"
                            >
                                {comment.username}
                            </button>

                            <span className="text-sm text-[var(--text-muted)]">
                                {comment.createdAtLabel || "now"}
                            </span>

                            {comment.edited && (
                                <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[0.7rem] text-[var(--text-muted)]">
                                    Edited
                                </span>
                            )}
                        </div>

                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)] active:scale-95"
                                aria-label="Comment options"
                            >
                                <MoreHorizIcon sx={{ fontSize: 20 }} />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
                                >
                                    {isOwnComment && (
                                        <>
                                            <button type="button"
                                                onClick={() => {
                                                    setIsMenuOpen(false)
                                                    onStartEditComment?.(comment)
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
                                            >
                                                <EditRoundedIcon sx={{ fontSize: 18 }} />
                                                Edit comment
                                            </button>                                        

                                            <button type="button" 
                                                onClick={() => {
                                                    setIsMenuOpen(false)
                                                    onDeleteComment?.(comment)
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--danger-text)] transition hover:bg-[var(--danger-soft-hover)] hover:text-[var(--danger)]"
                                            >
                                                <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                                Delete comment
                                            </button>
                                        </>
                                    )}

                                    {!isOwnComment && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!comment.userId) return

                                                setIsMenuOpen(false)

                                                onBlockUser?.({
                                                userId: comment.userId,
                                                username: comment.username,
                                                profileImage: comment.profileImage || "",
                                                })
                                            }}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--danger-text)] transition hover:bg-[var(--danger-soft-hover)] hover:text-[var(--danger)]"
                                        >
                                            <BlockRoundedIcon sx={{ fontSize: 18 }} />
                                            Block user
                                        </button>
                                    )}
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    {isEditing ? (
                        <div className="mt-2">
                            <textarea 
                                value={editValue}
                                onChange={(event) => setEditValue(event.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--input-placeholder)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                            />

                            <div className="mt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={isUpdatingComment}
                                    onClick={onCancelEditComment}
                                    className="rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={!editValue.trim() || editValue.trim() === comment.text.trim() || isUpdatingComment}
                                    onClick={() => onUpdateComment?.(comment, editValue.trim())}
                                    className="rounded-md bg-[var(--button-secondary-bg)] px-3 py-1.5 text-sm text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isUpdatingComment ? (
                                        <CircularProgress size={18} thickness={5} sx={{color: "var(--text-secondary)"}}/>
                                    ) : 
                                    "Save"
                                    }
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="leading-7 text-[var(--text-primary)] text-sm">
                            {renderCommentText(comment)}
                        </p>
                    )}

                    {!isEditing && (
                        <div className="mt-1 flex items-center gap-3 text-[var(--text-muted)]">
                            <button 
                                type="button" 
                                onClick={() => onToggleCommentReaction?.(comment, "like")}
                                disabled={!currentUserId}
                                className={[
                                    "inline-flex items-center gap-1 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                                    isLiked ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                <ThumbUpRoundedIcon sx={{ fontSize: 18 }} />
                                {Number(comment.likesCount || 0) > 0 && (
                                    <span className="text-xs">{comment.likesCount}</span>
                                )}
                            </button>

                            <button 
                                type="button" 
                                onClick={() => onToggleCommentReaction?.(comment, "dislike")}
                                disabled={!currentUserId}
                                className={[
                                    "inline-flex items-center gap-1 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                                    isDisliked ? "text-[var(--danger)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                <ThumbDownRoundedIcon sx={{ fontSize: 18 }} />
                                {Number(comment.dislikesCount || 0) > 0 && (
                                    <span className="text-xs">{comment.dislikesCount}</span> 
                                )}
                                   
                            </button>


                            {canReply && (
                                <button 
                                    type="button" 
                                    onClick={() => onStartReplyComment?.(comment)}
                                    className="transition hover:text-[var(--text-primary)] active:scale-95"
                                >
                                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                </button>
                            )}
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {isReplying && !isEditing && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -6 }}
                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -6 }}
                                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 rounded-xl bg-[var(--surface-subtle)] p-3">
                                     <textarea
                                        ref={replyTextareaRef}
                                        value={replyValue}
                                        onChange={(event) => setReplyValue(event.target.value)}
                                        rows={3}
                                        className="w-full resize-none bg-transparent text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--input-placeholder)]"
                                    />

                                    <div className="mt-2 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            disabled={isSubmittingReply}
                                            onClick={onCancelReplyComment}
                                            className="flex h-8 w-8 items-center justify-center rounded-md text-sm text-[var(--text-secondary)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
                                        >
                                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!replyValue.trim() || !hasReplyText || isSubmittingReply}
                                            onClick={() => onReplyComment?.(comment, replyValue.trim())}
                                            className="flex items-center justify-center rounded-md bg-[var(--button-secondary-bg)] h-8 w-8 text-sm text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isSubmittingReply ? (
                                                <CircularProgress size={18} thickness={5} sx={{color: "var(--text-secondary)"}}/>
                                            ) : (
                                                <SendRoundedIcon sx={{fontSize: 18}} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {hasReplies && !isReply && (
                        <button
                        type="button"
                        onClick={() => setShowReplies((prev) => !prev)}
                        className="mt-5 flex items-center gap-3 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                        >
                        {replies.length} replies

                        <motion.span
                            animate={{ rotate: showReplies ? 180 : 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center"
                        >
                            <ExpandMoreRoundedIcon sx={{ fontSize: 22 }} />
                        </motion.span>
                        </button>
                    )}

                    <AnimatePresence initial={false}>
                        {showReplies && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1}}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="mt-6 flex flex-col gap-7">
                            {replies.map((reply) => (
                                <CommentItem 
                                    key={reply.id}
                                    comment={reply}
                                    currentUserId={currentUserId}
                                    replyingCommentId={replyingCommentId}
                                    editingCommentId={editingCommentId}
                                    isReply
                                    isReplying={replyingCommentId === reply.id}
                                    isSubmittingReply={isSubmittingReply}
                                    onStartReplyComment={onStartReplyComment}
                                    onCancelReplyComment={onCancelReplyComment}
                                    onReplyComment={onReplyComment}
                                    onToggleCommentReaction={onToggleCommentReaction}
                                    isEditing={editingCommentId === reply.id}
                                    isUpdatingComment={isUpdatingComment}
                                    onStartEditComment={onStartEditComment}
                                    onCancelEditComment={onCancelEditComment}
                                    onUpdateComment={onUpdateComment}
                                    onDeleteComment={onDeleteComment}
                                    onAuthorClick={onAuthorClick}
                                    onBlockUser={onBlockUser}
                                    blockedUserIds={blockedUserIds}
                                    blockedByUserIds={blockedByUserIds}
                                />
                            ))}
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
