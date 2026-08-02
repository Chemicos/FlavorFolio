import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { useEffect, useMemo, useState } from "react"
import { ProfileConnectionType, ProfileConnectionUser, subscribeToProfileConnections } from "../services/profileConnections.service"

import { AnimatePresence, motion } from "motion/react"
import { CircularProgress } from "@mui/material"
import { useNavigate } from "react-router-dom"

interface ProfileConnectionsModalProps {
  isOpen: boolean
  userId: string | null
  currentUserId?: string | null
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
    currentUserId,
    type,
    onClose,
}: ProfileConnectionsModalProps) {
    const navigate = useNavigate()

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

    const handleUserClick = (nextUserId: string) => {
      onClose()

      if (nextUserId === currentUserId) {
        navigate("/profile")
        return
      }

      navigate(`/users/${nextUserId}`)
    }

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay)] px-4"
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
            className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-dropdown)] transition-colors"
          >
            <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
              
                <button
                type="button"
                onClick={onClose}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-lg border transition",
                  "border-transparent text-[var(--text-muted)]",
                  "hover:border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                ].join(" ")}
                >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </button>
            </header>

            <div className="p-6">
              <div className="relative">
                <SearchRoundedIcon
                  sx={{ fontSize: 20 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />

                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search a profile..."
                  className={[
                    "h-12 w-full rounded-lg border pl-11 pr-4 text-sm outline-none transition",
                    "border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]",
                    "placeholder:text-[var(--input-placeholder)]",
                    "hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)]",
                    "focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]",
                  ].join(" ")}
                />
              </div>

              <div className="mt-6 max-h-[420px] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <CircularProgress size={30} sx={{ color: "var(--accent)" }} />
                  </div>
                ) : visibleUsers.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-6 text-center text-sm text-[var(--text-muted)]">
                    No profiles found.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {visibleUsers.map((user) => (
                      <button
                        key={user.uid}
                        type="button"
                        onClick={() => handleUserClick(user.uid)}
                        className="flex w-full items-center gap-3 px-3 py-4 text-left transition hover:bg-[var(--surface-hover)]"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                            {user.username}
                          </p>

                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {formatSince(user.followedAt)}
                          </p>
                        </div>
                      </button>
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
