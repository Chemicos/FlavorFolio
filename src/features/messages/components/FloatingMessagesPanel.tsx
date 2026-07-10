import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"

import { useNavigate } from "react-router-dom"
import { Conversation } from "../types/messages.types"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import ConversationListItem from "./ConversationListItem"

interface FloatingMessagesPanelProps {
  isOpen: boolean
  currentUserId: string
  conversations: Conversation[]
  onClose: () => void
  rightOffset?: number
}

export default function FloatingMessagesPanel({
  isOpen,
  currentUserId,
  conversations,
  onClose,
  rightOffset = 24,
}: FloatingMessagesPanelProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return conversations

    return conversations.filter((conversation) => {
      const otherUserId = conversation.participantIds.find(
        (id) => id !== currentUserId
      )

      if (!otherUserId) return false

      const participant = conversation.participants?.[otherUserId]

      return participant?.username?.toLowerCase().includes(query)
    })
  }, [conversations, currentUserId, search])

  const handleOpenFullMessages = () => {
    onClose()
    navigate("/messages")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{right: rightOffset}}
          className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16181d]/95 shadow-[0_24px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          <header className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Messages</h2>
                <p className="mt-1 text-xs text-[#8f97b1]">
                  Continue your conversations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenFullMessages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#a8b3cf] transition hover:bg-white/[0.08] hover:text-white active:scale-95"
                aria-label="Open full messages"
              >
                <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="relative mt-4">
              <SearchRoundedIcon
                sx={{ fontSize: 18 }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7892]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="h-10 w-full rounded-lg border border-white/10 bg-[#0b0b0c] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-[#feaa2b]/50 focus:ring-2 focus:ring-[#feaa2b]/10"
              />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
            {filteredConversations.length > 0 ? (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.conversationId}
                    conversation={conversation}
                    currentUserId={currentUserId}
                    onClick={() => {
                      onClose()
                      navigate(`/messages/${conversation.conversationId}`)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#8f97b1]">
                  <SearchRoundedIcon />
                </div>

                <p className="mt-4 text-sm font-semibold text-white">
                  No conversations found
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8f97b1]">
                  Start a conversation from a user profile or search users in the full messages page.
                </p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
