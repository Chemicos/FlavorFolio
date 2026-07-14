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
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 bg-[#16181d]/95 px-6">
      <button
        type="button"
        onClick={handleOpenProfile}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04] active:scale-[0.99]"
      >
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10 transition group-hover:ring-[#feaa2b]/35">
            {participant.profileImage ? (
              <img
                src={participant.profileImage}
                alt={participant.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                {participant.username
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <span
            className={[
              "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#16181d] transition",
              isOnline
                ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                : "bg-[#596176]",
            ].join(" ")}
            aria-label={
              isOnline
                ? `${participant.username} is online`
                : `${participant.username} is offline`
            }
          />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-white transition group-hover:text-[#ffd28a]">
            {participant.username}
          </h2>

          <p
            className={[
              "mt-0.5 truncate text-xs transition",
              isOnline
                ? "text-emerald-300"
                : "text-[#8f97b1]",
            ].join(" ")}
          >
            {statusLabel}
          </p>
        </div>
      </button>
    </header>
  )
}
