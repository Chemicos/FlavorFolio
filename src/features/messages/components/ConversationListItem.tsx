import { useNavigate } from "react-router-dom"
import { Conversation } from "../types/messages.types"
import { useEffect, useState } from "react"

interface ConversationListItemProps {
  conversation: Conversation
  currentUserId: string
  onClick?: () => void
  isActive?: boolean
}

function getDateFromValue(value: unknown): Date | null {
  if (!value) return null

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return null
}

function getCalendarDayDifference(
  targetDate: Date,
  currentDate: Date
) {
  const targetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  const currentDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  )

  return Math.round(
    (targetDay.getTime() - currentDay.getTime()) /
      86_400_000
  )
}

function formatTime(value: unknown) {
  const date = getDateFromValue(value)

  if (!date) return ""

  const now = new Date()

  const dayDifference = Math.min(
    0,
    getCalendarDayDifference(date, now)
  )

  if (dayDifference === 0) {
    return "Today"
  }

  if (dayDifference === -1) {
    return "Yesterday"
  }

  if (dayDifference > -7) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    }).format(dayDifference, "day")
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date)
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

  const [hasImageError, setHasImageError] = useState(false)

  useEffect(() => {
    setHasImageError(false)
  }, [participant?.profileImage])

  const unreadCount = isActive ? 0 : Number(
    conversation.unreadCount?.[
      currentUserId
    ] || 0
  )

  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) onClick()
        else navigate(`/messages/${conversation.conversationId}`, {replace: true})
      }}
      className={[
        "flex w-full items-center gap-3 rounded-xl p-3 text-left border transition-colors duration-200 active:scale-[0.99]",
        isActive
          ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
          : "border-transparent hover:bg-[var(--surface-hover)]",
      ].join(" ")}
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        {participant?.profileImage && !hasImageError ? (
          <img
            src={participant.profileImage}
            alt={participant.username || "Conversation participant"}
            onError={() => setHasImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
            {(participant?.username || "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {participant?.username || "Unknown user"}
          </p>
          <span className="shrink-0 text-xs text-[var(--text-muted)]">
            {formatTime(conversation.updatedAt)}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
          {conversation.lastMessage?.text || "No messages yet."}
        </p>
      </div>

      {unreadCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[0.68rem] font-bold text-[var(--text-on-accent)]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
