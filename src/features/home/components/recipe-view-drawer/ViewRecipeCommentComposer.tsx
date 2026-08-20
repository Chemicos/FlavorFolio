import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CircularProgress from "@mui/material/CircularProgress"
import { AnimatePresence, motion } from "motion/react";

import { useEffect, useRef, useState } from "react"
import { CurrentUserCardData } from "../../types/recipeCard.types"

interface ViewRecipeCommentComposerProps {
  currentUser: CurrentUserCardData | null
  onSubmit?: (commentText: string) => void
  isSubmiting?: boolean
  canComment?: boolean
}

export default function ViewRecipeCommentComposer({
    currentUser,
    onSubmit,
    isSubmiting = false,
    canComment = true,
}: ViewRecipeCommentComposerProps) {
    const [commentText, setCommentText] = useState("")
    const [isExpanded, setIsExpanded] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const handleExpand = () => {
        if (!canComment) return

        setIsExpanded(true)

        window.setTimeout(() => {
            textareaRef.current?.focus()
        }, 160)
    }

    useEffect(() => {
        if (canComment) return

        setCommentText("")
        setIsExpanded(false)
    }, [canComment])

    const handleCancel = () => {
        setCommentText("")
        setIsExpanded(false)
    }

    const handleSubmit = async () => {
        if (!canComment) return 

        const trimmedValue = commentText.trim()
        if (!trimmedValue || isSubmiting) return

        await onSubmit?.(trimmedValue)

        setCommentText("")
        setIsExpanded(false)
    }

    if (!canComment) {
        return (
            <div className="rounded-lg border p-4 border-[var(--warning-border)] bg-[var(--warning-soft)]">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--warning-text)]">
                        <LockOutlinedIcon sx={{ fontSize: 19 }} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Commenting restricted
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                            Your account is currently restricted from posting comments or replies.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <motion.div 
            initial={false}
            animate={{height: isExpanded ? 320 : 84}}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1]}}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
        >
            <div className="flex items-start gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
                    {currentUser?.profileImage ? (
                        <img 
                            src={currentUser.profileImage} 
                            alt={currentUser.username} 
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
                            {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <AnimatePresence mode="wait" initial={false}>
                        {!isExpanded ? (
                            <motion.button
                                key="collapsed"
                                type="button"
                                onClick={handleExpand}
                                initial={{ opacity: 0}}
                                animate={{ opacity: 1}}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-2 text-left transition hover:bg-[var(--hover)]"
                            >
                                <span className="text-sm text-[var(--input-placeholder)]">
                                    Share your thoughts...
                                </span>

                                <SendRoundedIcon className="shrink-0 text-[var(--text-secondary)]" />
                            </motion.button>
                        ) : (
                            <motion.div
                                key="expanded"
                                initial={{opacity: 0, y: -6, filter: "blur(6px)"}}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="rounded-2xl px-4 py-3"
                            >
                                <textarea 
                                    ref={textareaRef}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    rows={7}
                                    className="min-h-[190px] w-full resize-none text-sm bg-transparent leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--input-placeholder)]"
                                />

                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSubmiting}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Cancel comment"
                                    >
                                        <CloseRoundedIcon sx={{ fontSize: 21 }} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!commentText.trim() || isSubmiting}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Submit comment"
                                    >
                                        {isSubmiting ? (
                                            <CircularProgress size={18} thickness={5} sx={{color: "var(--text-secondary)"}}/>
                                        ) : (
                                            <SendRoundedIcon />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}
