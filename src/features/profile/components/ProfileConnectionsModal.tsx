import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { useEffect, useMemo, useState } from "react"
import { ProfileConnectionType, ProfileConnectionUser, subscribeToProfileConnections } from "../services/profileConnections.service"

import { AnimatePresence, motion } from "motion/react"
import { CircularProgress } from "@mui/material"

interface ProfileConnectionsModalProps {
  isOpen: boolean
  userId: string | null
  type: ProfileConnectionType
  onClose: () => void
}

function formatSince(followedAt?: ProfileConnectionUser["followedAt"]) {
  if (!followedAt?.seconds) return "Recently"

  return `Since ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(followedAt.seconds * 1000))}`
}


export default function ProfileConnectionsModal({
    isOpen,
    userId,
    type,
    onClose,
}: ProfileConnectionsModalProps) {
    const [users, setUsers] = useState<ProfileConnectionUser[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("")
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || !userId) return

        setIsLoading(true)

        const unsubscribe = subscribeToProfileConnections({
            userId,
            type,
            onChange: (result) => {
                setUsers(result)
                setIsLoading(false)
            },
            onError: (error) => {
                console.error("Failed to load profile connections:", error)
                setIsLoading(false)
            },
        })

        return () => unsubscribe()
    }, [isOpen, userId, type])

    const visibleUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return users

        return users.filter((user) =>
            user.username.toLowerCase().includes(query)
        )
    }, [users, searchQuery])

    const title = type === "followers" ? "Followers" : "Following"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-[#111318] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <h2 className="text-xl font-bold text-white">{title}</h2>
              
                <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8f97b1] transition hover:bg-white/[0.06] hover:text-white"
                >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </button>
            </header>

            <div className="p-6">
              <div className="relative">
                <SearchRoundedIcon
                  sx={{ fontSize: 20 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f7892]"
                />

                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search a profile..."
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#0b0b0c] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50"
                />
              </div>

              <div className="mt-6 max-h-[420px] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <CircularProgress size={30} sx={{ color: "#feaa2b" }} />
                  </div>
                ) : visibleUsers.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-[#8f97b1]">
                    No profiles found.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {visibleUsers.map((user) => (
                      <div
                        key={user.uid}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-full bg-white/10">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {user.username}
                            </p>
                            <p className="mt-0.5 text-xs text-[#8f97b1]">
                              {formatSince(user.followedAt)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="rounded-lg bg-[#0b0b0c] px-4 py-2 text-sm font-semibold text-[#d7def0] transition hover:bg-white/[0.06] hover:text-white"
                        >
                          {type === "followers" ? "View" : "Following"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
