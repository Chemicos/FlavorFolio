import { useEffect, useRef, useState } from "react"

import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded"
import ThumbDownRoundedIcon from "@mui/icons-material/ThumbDownRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import { AnimatePresence, motion } from "motion/react"

export interface ViewRecipeComment {
  id: string
  userId?: string
  username: string
  profileImage?: string
  text: string
  createdAtLabel?: string
  replies?: ViewRecipeComment[]
}

interface ViewRecipeCommentListProps {
  comments?: ViewRecipeComment[]
  onDeleteComment?: (comment: ViewRecipeComment) => void
}

export default function ViewRecipeCommentList({ comments = [], onDeleteComment}: ViewRecipeCommentListProps) {
    if (!comments.length) {
        return (
          <p className="text-sm text-[#a8b3cf]/40 text-center">
            No comments yet. Be the first to share your thoughts.
          </p>
        )
    }    

    return (
       <div className="flex flex-col gap-8">
            {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} onDeleteComment={onDeleteComment} />
            ))}
        </div> 
    )
}

function CommentItem({
    comment, 
    isReply = false,
    onDeleteComment
}: {
    comment: ViewRecipeComment 
    isReply?: boolean
    onDeleteComment?: (comment: ViewRecipeComment) => void
}) {
    const [showReplies, setShowReplies] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const menuRef = useRef<HTMLDivElement | null>(null)

    const replies = comment.replies || []
    const hasReplies = replies.length > 0

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
        <div className={isReply ? "ml-10" : ""}>
            <div className="flex items-start gap-4">
                <div
                    className={[
                        "shrink-0 overflow-hidden bg-white/10",
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
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
                    {comment.username.charAt(0).toUpperCase()}
                    </div>
                )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                            <p className={isReply ? "text-sm font-medium text-white" : "text-sm font-bold text-white"}>
                            {comment.username}
                            </p>

                            <span className="text-sm text-[#a8b3cf]/60">
                            {comment.createdAtLabel || "now"}
                            </span>
                        </div>

                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#a8b3cf]/50 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
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
                                    className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                                >
                                    <button type="button"
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#d7def0] transition hover:bg-[#16181d] hover:text-white"
                                    >
                                        <EditRoundedIcon sx={{ fontSize: 18 }} />
                                        Edit comment
                                    </button>

                                    <button type="button" 
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            onDeleteComment?.(comment)
                                        }}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d]"
                                    >
                                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                        Delete comment
                                    </button>

                                    <button type="button"
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d]"
                                    >
                                        <BlockRoundedIcon sx={{ fontSize: 18 }} />
                                        Block user
                                    </button>
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <p className="mt-1 leading-7 text-white text-sm">
                        {comment.text}
                    </p>

                    <div className="flex items-center gap-3 text-[#a8b3cf]/50">
                        <button type="button" className="transition hover:text-white active:scale-95">
                        <ThumbUpRoundedIcon sx={{ fontSize: 18 }} />
                        </button>

                        <button type="button" className="transition hover:text-white active:scale-95">
                        <ThumbDownRoundedIcon sx={{ fontSize: 18 }} />
                        </button>

                        <button type="button" className="transition hover:text-white active:scale-95">
                        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                        </button>
                    </div>

                    {hasReplies && !isReply && (
                        <button
                        type="button"
                        onClick={() => setShowReplies((prev) => !prev)}
                        className="mt-5 flex items-center gap-3 text-sm font-medium text-[#7f89a6] transition hover:text-white"
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
                            initial={{ height: 0, opacity: 0, y: -6 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -6 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="mt-6 flex flex-col gap-7">
                            {replies.map((reply) => (
                                <CommentItem key={reply.id} comment={reply} isReply />
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
