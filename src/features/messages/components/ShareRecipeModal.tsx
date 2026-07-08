import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { useMemo, useState } from "react"
import { SharedRecipeMessage } from "../types/messages.types"
import { useMutualFollowers } from "../hooks/useMutualFollowers"
import { shareRecipeMessage } from "../services/messages.service"
import { AnimatePresence, motion } from "motion/react"
import { CircularProgress } from "@mui/material"

interface ShareRecipeModalProps {
    isOpen: boolean
    currentUserId: string | null
    recipe: SharedRecipeMessage | null
    onClose: () => void
    onShared?: (username: string, conversationId: string) => void
}

export default function ShareRecipeModal({
    isOpen,
    currentUserId,
    recipe,
    onClose,
    onShared,
}: ShareRecipeModalProps) {
    const [search, setSearch] = useState("")
    const [sendingToUserId, setSendingToUserId] = useState<string | null>(null)

    const { users, isLoading } = useMutualFollowers(currentUserId)

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return users

        return users.filter((user) =>
        [user.username, user.firstName, user.lastName]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
    }, [users, search])

    const handleShare = async (receiverId: string, username: string) => {
        if (!currentUserId || !recipe || sendingToUserId) return

        try {
            setSendingToUserId(receiverId)

            const result = await shareRecipeMessage({
                senderId: currentUserId,
                receiverId,
                recipe,
            })

            onShared?.(username, result.conversationId)
            onClose()
            setSearch("")
        } finally {
            setSendingToUserId(null)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                >
                <motion.section
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[#16181d] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
                >
                    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="text-base font-bold text-white">Share recipe</h2>
                        <p className="mt-1 text-xs text-[#8f97b1]">
                        Send this recipe to someone you mutually follow.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </button>
                    </header>

                    {recipe && (
                    <div className="border-b border-white/10 px-5 py-4">
                        <div className="flex items-center gap-3 rounded-xl bg-[#0b0b0c] p-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                            {recipe.image && (
                            <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="h-full w-full object-cover"
                            />
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                            {recipe.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-[#8f97b1]">
                            by {recipe.authorUsername || "Unknown"}
                            </p>
                        </div>
                        </div>
                    </div>
                    )}

                    <div className="px-5 py-4">
                    <div className="relative">
                        <SearchRoundedIcon
                        sx={{ fontSize: 18 }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7892]"
                        />

                        <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search mutual followers..."
                        className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0b0c] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-[#feaa2b]/20 focus:border-[#feaa2b]/50 focus:ring-2 focus:ring-[#feaa2b]/10"
                        />
                    </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto px-3 pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                        <CircularProgress size={28} sx={{ color: "#feaa2b" }} />
                        </div>
                    ) : filteredUsers.length ? (
                        <div className="space-y-2">
                        {filteredUsers.map((user) => (
                            <button
                            key={user.userId}
                            type="button"
                            onClick={() => handleShare(user.userId, user.username)}
                            disabled={sendingToUserId === user.userId}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                                {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                                ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                {user.username}
                                </p>
                                <p className="truncate text-xs text-[#8f97b1]">
                                {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                                    "Mutual follower"}
                                </p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#feaa2b]/10 text-[#feaa2b]">
                                {sendingToUserId === user.userId ? (
                                <CircularProgress size={17} sx={{ color: "#feaa2b" }} />
                                ) : (
                                <SendRoundedIcon sx={{ fontSize: 18 }} />
                                )}
                            </div>
                            </button>
                        ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                        <p className="text-sm font-semibold text-white">
                            No mutual followers found
                        </p>
                        <p className="mt-1 text-xs text-[#8f97b1]">
                            You can share recipes only with users who follow you back.
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
