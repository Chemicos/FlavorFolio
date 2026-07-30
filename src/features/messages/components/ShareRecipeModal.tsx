import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import MovieRoundedIcon from "@mui/icons-material/MovieRounded"

import { useMemo, useState } from "react"
import { SharedRecipeMessage, SharedReelMessage } from "../types/messages.types"
import { useMutualFollowers } from "../hooks/useMutualFollowers"
import { shareRecipeMessage, shareReelMessage } from "../services/messages.service"
import { AnimatePresence, motion } from "motion/react"
import { CircularProgress } from "@mui/material"

interface ShareRecipeModalProps {
    isOpen: boolean
    currentUserId: string | null
    recipe?: SharedRecipeMessage | null
    reel?: SharedReelMessage | null
    onClose: () => void
    onShared?: (username: string, conversationId: string) => void
}

export default function ShareRecipeModal({
    isOpen,
    currentUserId,
    recipe = null,
    reel = null,
    onClose,
    onShared,
}: ShareRecipeModalProps) {
    const [search, setSearch] = useState("")
    const [sendingToUserId, setSendingToUserId] = useState<string | null>(null)

    const { users, isLoading } = useMutualFollowers(currentUserId)
    const contentType = reel ? "reel" : "recipe"

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        if (!normalizedSearch) {
            return users
        }

        return users.filter((user) =>
        [
            user.username,
            user.firstName,
            user.lastName,
        ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        )
    }, [users, search])

    const handleClose = () => {
        if (sendingToUserId) return

        setSearch("")
        onClose()
    }

    const handleShare = async (
        receiverId: string,
        username: string
    ) => {
        if (
            !currentUserId ||
            sendingToUserId ||
            (!recipe && !reel)
        ) {
            return
        }

        try {
            setSendingToUserId(receiverId)

            const result = reel
                ? await shareReelMessage({
                    senderId: currentUserId,
                    receiverId,
                    reel,
                })
                : await shareRecipeMessage({
                    senderId: currentUserId,
                    receiverId,
                    recipe: recipe!,
                })

            onShared?.(
                username,
                result.conversationId
            )

            setSearch("")
            onClose()
        } finally {
            setSendingToUserId(null)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--overlay)] px-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                >
                <motion.section
                    initial={{opacity: 0, y: 18, scale: 0.96,}}
                    animate={{opacity: 1, y: 0, scale: 1,}}
                    exit={{opacity: 0, y: 18, scale: 0.96,}}
                    transition={{ duration: 0.18 }}
                    onClick={(event) => event.stopPropagation()}
                    className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-dropdown)]"
                >
                    <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                        {contentType === "reel"
                            ? "Share reel"
                            : "Share recipe"}
                        </h2>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Send this {contentType} to someone you mutually follow.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={Boolean(sendingToUserId)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close share dialog"
                    >
                        <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </button>
                    </header>

                    {(recipe || reel) && (
                        <div className="border-b border-[var(--border)] px-5 py-4">
                            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
                                {recipe?.image ? (
                                    <img
                                        src={recipe.image}
                                        alt={recipe.title}
                                        className="h-full w-full object-cover"
                                    />
                                    ) : reel?.thumbnail ? (
                                    <img
                                        src={reel.thumbnail}
                                        alt={reel.title}
                                        className="h-full w-full object-cover"
                                    />
                                    ) : reel?.videoUrl ? (
                                    <video
                                        src={reel.videoUrl}
                                        muted
                                        preload="metadata"
                                        className="h-full w-full object-cover"
                                    />
                                    ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[var(--accent)]">
                                        <MovieRoundedIcon />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--accent-text)]">
                                        {contentType}
                                    </span>
                                </div>

                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                    {reel?.title || recipe?.title}
                                </p>

                                <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                    by{" "}
                                    {reel?.authorUsername || recipe?.authorUsername || "Unknown"}
                                </p>
                            </div>
                            </div>
                        </div>
                    )}

                    <div className="px-5 py-4">
                    <div className="relative">
                        <SearchRoundedIcon
                            sx={{ fontSize: 18 }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--input-placeholder)]"
                        />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search mutual followers..."
                            className="h-11 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                        />
                    </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto px-3 pb-3 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                        <CircularProgress
                            size={28}
                            sx={{ color: "var(--accent)" }}
                        />
                        </div>
                    ) : filteredUsers.length ? (
                        <div className="space-y-2">
                        {filteredUsers.map((user) => {
                            const isSending = sendingToUserId === user.userId

                            return (
                            <button
                                key={user.userId}
                                type="button"
                                onClick={() =>
                                handleShare(user.userId, user.username)
                                }
                                disabled={Boolean(sendingToUserId)}
                                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt={user.username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                </div>

                                <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                    {user.username}
                                </p>

                                <p className="truncate text-xs text-[var(--text-muted)]">
                                    {[user.firstName,user.lastName,].filter(Boolean).join(" ") ||"Mutual follower"}
                                </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                                {isSending ? (
                                    <CircularProgress size={17} sx={{color: "var(--accent)"}} />
                                ) : (
                                    <SendRoundedIcon sx={{fontSize: 18}} />
                                )}
                                </div>
                            </button>
                            )
                        })}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                No mutual followers found
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                You can share content only with users who follow you back.
                            </p>
                        </div>
                    )}
                    </div>
                </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
