import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded"
import { CircularProgress } from "@mui/material"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"
import { useEffect, useMemo, useState } from "react"
import { BlockedUser, subscribeToBlockedUsers, unblockUser } from "../services/blockedUsers.service"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import { getAuth, onAuthStateChanged } from "firebase/auth"

interface BlockedUserItem {
  id: string
  username: string
  profileImage: string
  blockedAtLabel: string
}

function formatBlockedAt(blockedAt?: BlockedUser["blockedAt"]) {
  if (!blockedAt?.seconds) return "Blocked recently"

  return `Blocked ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(blockedAt.seconds * 1000))}`
}


export default function BlockedAccountsSection() {
  const { showSnackbar } = useSnackbar()

  const [userId, setUserId] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
  }, [])

  useEffect(() => {
    if (!userId) {
      setBlockedUsers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = subscribeToBlockedUsers({
      userId,
      onChange: (result) => {
        setBlockedUsers(result)
        setIsLoading(false)
      },
      onError: (error) => {
        console.error("Failed to load blocked users:", error)
        showSnackbar("Failed to load blocked accounts.", "error")
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [userId, showSnackbar])

  const visibleBlockedUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return blockedUsers

    return blockedUsers.filter((user) =>
      user.username.toLowerCase().includes(query)
    )
  }, [blockedUsers, searchQuery])

  const handleUnblockUser = async (targetUser: BlockedUser) => {
    if (!userId || unblockingUserId) return

    try {
      setUnblockingUserId(targetUser.uid)

      await unblockUser({
        currentUserId: userId,
        targetUserId: targetUser.uid,
      })

      setBlockedUsers((prev) =>
        prev.filter((user) => user.uid !== targetUser.uid)
      )

      showSnackbar(`${targetUser.username} has been unblocked.`, "success")
    } catch (error) {
      console.error("Failed to unblock user:", error)
      showSnackbar("Failed to unblock user. Please try again.", "error")
    } finally {
      setUnblockingUserId(null)
    }
  }

  return (
    <section>
      <AccountSettingsSectionHeader
        title="Blocked accounts"
        description="Manage people you blocked. They will not be able to interact with your profile or recipes."
      />

      <div className="mt-8 rounded-2xl border border-white/10 p-6">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <CircularProgress size={30} sx={{ color: "#feaa2b" }} />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0b0b0c] px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#8f97b1]">
              <PersonOffRoundedIcon sx={{ fontSize: 26 }} />
            </div>

            <h3 className="mt-5 text-base font-bold text-white">
              No blocked accounts
            </h3>

            <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#8f97b1]">
              When you block someone, they will appear here and you can unblock
              them anytime.
            </p>
          </div>
        ) : (
          <>
            <div className="relative mb-5">
              <SearchRoundedIcon
                sx={{ fontSize: 20 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f7892]"
              />

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search blocked accounts..."
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0b0b0c] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"
              />
            </div>

            {visibleBlockedUsers.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0b0b0c]/50 text-sm text-[#8f97b1]">
                No blocked accounts found.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleBlockedUsers.map((user) => {
                  const isUnblocking = unblockingUserId === user.uid

                  return (
                    <div
                      key={user.uid}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0b0b0c] px-4 py-3 transition hover:border-white/15 hover:bg-[#0f1116]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
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
                            {formatBlockedAt(user.blockedAt)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={Boolean(unblockingUserId)}
                        onClick={() => handleUnblockUser(user)}
                        className="inline-flex h-10 min-w-[104px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUnblocking ? (
                          <CircularProgress size={16} thickness={5} sx={{ color: "#d7def0" }} />
                        ) : (
                          "Unblock"
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
