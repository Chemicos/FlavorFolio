import { useNavigate } from "react-router-dom"
import { ConversationParticipant } from "../types/messages.types"

interface ChatHeaderProps {
  participant: ConversationParticipant
  isOnline: boolean
  statusLabel: string
}

export default function ChatHeader({
  participant,
  isOnline,
  statusLabel,
}: ChatHeaderProps) {
  const navigate = useNavigate()

  const handleOpenProfile = () => {
    if (!participant.userId) return
    navigate(`/users/${participant.userId}`)
  }
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6">
      <button
        type="button"
        onClick={handleOpenProfile}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--surface-hover)] active:scale-[0.99]"
      >
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full bg-[var(--surface-muted)] ring-1 ring-[var(--border)] transition group-hover:ring-[var(--accent-border)]">
            {participant.profileImage ? (
              <img
                src={participant.profileImage}
                alt={participant.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                {participant.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <span
            className={[
              "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-secondary)] transition",
              isOnline
                ? "bg-[var(--success)] shadow-[0_0_10px_var(--success-border)]"
                : "bg-[var(--text-disabled)]",
            ].join(" ")}
            aria-label={
              isOnline
                ? `${participant.username} is online`
                : `${participant.username} is offline`
            }
          />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-[var(--text-primary)] transition group-hover:text-[var(--accent-text)]">
            {participant.username}
          </h2>

          <p
            className={[
              "mt-0.5 truncate text-xs transition",
              isOnline
                ? "text-[var(--success-text)]"
                : "text-[var(--text-muted)]",
            ].join(" ")}
          >
            {statusLabel}
          </p>
        </div>
      </button>
    </header>
  )
}
