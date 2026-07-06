import { useNavigate } from "react-router-dom"
import { Conversation } from "../types/messages.types"

interface ConversationListItemProps {
  conversation: Conversation
  currentUserId: string
  onClick?: () => void
  isActive?: boolean
}

function formatTime(value: any) {
  if (!value) return ""

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : null

  if (!date) return ""

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.ceil((date.getTime() - Date.now()) / 86_400_000),
    "day"
  )
}

export default function ConversationListItem({
  conversation,
  currentUserId,
  onClick,
  isActive = false,
}: ConversationListItemProps) {
  const navigate = useNavigate()

  const otherUserId = conversation.participantIds.find(
    (id) => id !== currentUserId
  )

  const participant = otherUserId
    ? conversation.participants?.[otherUserId]
    : null

  const unreadCount = Number(conversation.unreadCount?.[currentUserId] || 0)

  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) onClick()
        else navigate(`/messages/${conversation.conversationId}`)
      }}
      className={[
        "flex w-full items-center gap-3 rounded-xl p-3 text-left transition active:scale-[0.99]",
        isActive
          ? "border border-[#feaa2b]/25 bg-[#feaa2b]/10"
          : "border border-transparent hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
        {participant?.profileImage ? (
          <img
            src={participant.profileImage}
            alt={participant.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
            {(participant?.username || "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <p className="truncate text-sm font-semibold text-white">
            {participant?.username || "Unknown user"}
          </p>
          <span className="shrink-0 text-xs text-[#7f89a6]">
            {formatTime(conversation.updatedAt)}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-[#8f97b1]">
          {conversation.lastMessage?.text || "No messages yet."}
        </p>
      </div>

      {unreadCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#feaa2b] px-1.5 text-[0.68rem] font-bold text-[#0d0e11]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
