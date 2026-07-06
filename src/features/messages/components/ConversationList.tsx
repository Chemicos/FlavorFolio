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
    <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#16181d]">
      <header className="border-b border-white/10 p-5">
        <h1 className="text-xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-sm text-[#8f97b1]">
          Your recent conversations.
        </p>

        <div className="relative mt-4">
          <SearchRoundedIcon
            sx={{ fontSize: 18 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7892]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0b0c] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-[#feaa2b]/20 focus:border-[#feaa2b]/50 focus:ring-2 focus:ring-[#feaa2b]/10"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-[#8f97b1]">
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
          <p className="py-10 text-center text-sm text-[#8f97b1]">
            No conversations found.
          </p>
        )}
      </div>
    </aside>
  )
}
