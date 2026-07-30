import SearchRoundedIcon from "@mui/icons-material/SearchRounded"

import { useMemo, useState } from "react"
import { Conversation } from "../types/messages.types"
import ConversationListItem from "./ConversationListItem"

interface ConversationListProps {
  conversations: Conversation[]
  currentUserId: string
  activeConversationId: string | null
  isLoading?: boolean
}

export default function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  isLoading = false,
}: ConversationListProps) {
  const [search, setSearch] = useState("")

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations

    return conversations.filter((conversation) => {
      const otherUserId = conversation.participantIds.find(
        (id) => id !== currentUserId
      )

      if (!otherUserId) return false

      return conversation.participants?.[otherUserId]?.username
        ?.toLowerCase()
        .includes(query)
    })
  }, [conversations, currentUserId, search])
  
  return (
    <aside className="flex min-h-0 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      <header className="border-b border-[var(--border)] p-5">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Messages</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your recent conversations.
        </p>

        <div className="relative mt-4">
          <SearchRoundedIcon
            sx={{ fontSize: 18 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--input-placeholder)]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            className="h-11 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] hover:border-[var(--accent-border)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading conversations...
          </p>
        ) : filteredConversations.length ? (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.conversationId}
                conversation={conversation}
                currentUserId={currentUserId}
                isActive={activeConversationId === conversation.conversationId}
              />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-[var(--text-secondary)]">
            No conversations found.
          </p>
        )}
      </div>
    </aside>
  )
}
