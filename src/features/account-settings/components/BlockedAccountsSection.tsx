import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded"
import { CircularProgress } from "@mui/material"
import AccountSettingsSectionHeader from "./AccountSettingsSectionHeader"
import { useMemo, useState } from "react"

interface BlockedUserItem {
  id: string
  username: string
  profileImage: string
  blockedAtLabel: string
}

const mockBlockedUsers: BlockedUserItem[] = [
  {
    id: "1",
    username: "Kokomaru",
    profileImage: "",
    blockedAtLabel: "Blocked 2 months ago",
  },
  {
    id: "2",
    username: "BlockedUser",
    profileImage: "",
    blockedAtLabel: "Blocked 2 years ago",
  },
  {
    id: "3",
    username: "BlockedUser",
    profileImage: "",
    blockedAtLabel: "Blocked 1 day ago",
  },
]

export default function BlockedAccountsSection() {
  const isLoading = false
  const blockedUsers = mockBlockedUsers

  const [searchQuery, setSearchQuery] = useState("")

  const visibleBlockedUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return blockedUsers

    return blockedUsers.filter((user) =>
      user.username.toLowerCase().includes(query)
    )
  }, [blockedUsers, searchQuery])

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
                {visibleBlockedUsers.map((user) => (
                  <div
                    key={user.id}
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
                          {user.blockedAtLabel}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-10 min-w-[104px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-[#d7def0] transition hover:bg-white/[0.08] hover:text-white"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
