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
          className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-dropdown)]"
        >
          <header className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Messages</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Continue your conversations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenFullMessages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-95"
                aria-label="Open full messages"
              >
                <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="relative mt-4">
              <SearchRoundedIcon
                sx={{ fontSize: 18 }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--input-placeholder)]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="h-10 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                  <SearchRoundedIcon />
                </div>

                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  No conversations found
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
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
