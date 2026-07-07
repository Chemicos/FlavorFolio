import { useNavigate } from "react-router-dom"
import { ConversationParticipant } from "../types/messages.types"

interface ChatHeaderProps {
  participant: ConversationParticipant
}

export default function ChatHeader({participant}: ChatHeaderProps) {
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
        <div className="h-11 w-11 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10 transition group-hover:ring-[#feaa2b]/35">
          {participant.profileImage ? (
            <img
              src={participant.profileImage}
              alt={participant.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
              {participant.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-white transition group-hover:text-[#ffd28a]">
            {participant.username}
          </h2>

          <p className="text-xs text-[#8f97b1]">Open profile</p>
        </div>
      </button>
    </header>
  )
}
