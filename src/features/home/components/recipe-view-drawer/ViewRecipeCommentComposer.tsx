import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CircularProgress from "@mui/material/CircularProgress"
import { AnimatePresence, motion } from "motion/react";

import { useRef, useState } from "react"
import { CurrentUserCardData } from "../../types/recipeCard.types"

interface ViewRecipeCommentComposerProps {
  currentUser: CurrentUserCardData | null
  onSubmit?: (commentText: string) => void
  isSubmiting?: boolean
}

export default function ViewRecipeCommentComposer({
    currentUser,
    onSubmit,
    isSubmiting = false
}: ViewRecipeCommentComposerProps) {
    const [commentText, setCommentText] = useState("")
    const [isExpanded, setIsExpanded] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const handleExpand = () => {
        setIsExpanded(true)

        window.setTimeout(() => {
            textareaRef.current?.focus()
        }, 160)
    }

    const handleCancel = () => {
        setCommentText("")
        setIsExpanded(false)
    }

    const handleSubmit = async () => {
        const trimmedValue = commentText.trim()
        if (!trimmedValue || isSubmiting) return

        await onSubmit?.(trimmedValue)

        setCommentText("")
        setIsExpanded(false)
    }

    return (
        <motion.div 
            initial={false}
            animate={{height: isExpanded ? 320 : 84}}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1]}}
            className="rounded-[1rem] bg-[#0b0b0c]/75 p-4"
        >
            <div className="flex items-start gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-lg bg-white/10">
                    {currentUser?.profileImage ? (
                        <img 
                            src={currentUser.profileImage} 
                            alt={currentUser.username} 
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
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
                                className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-2 text-left transition"
                            >
                                <span className="text-sm text-[#5e6780]">
                                    Share your thoughts...
                                </span>

                                <SendRoundedIcon className="shrink-0 text-[#a8b3cf]" />
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
                                    className="min-h-[190px] w-full resize-none text-sm bg-transparent leading-7 text-white outline-none placeholder:text-[#5e6780]"
                                />

                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSubmiting}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-[#7f89a5] transition hover:bg-white/[0.04] 
                                        hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Cancel comment"
                                    >
                                        <CloseRoundedIcon sx={{ fontSize: 21 }} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!commentText.trim() || isSubmiting}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#a8b3cf]/10 text-white transition hover:bg-[#a8b3cf]/20 
                                        active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Submit comment"
                                    >
                                        {isSubmiting ? (
                                            <CircularProgress size={18} thickness={5} sx={{color: "#a8b3cf"}}/>
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
