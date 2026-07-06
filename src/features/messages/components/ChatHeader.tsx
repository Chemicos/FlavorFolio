import { ConversationParticipant } from "../types/messages.types"

interface ChatHeaderProps {
  participant: ConversationParticipant
}

export default function ChatHeader({participant}: ChatHeaderProps) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 bg-[#16181d]/95 px-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 overflow-hidden rounded-full bg-white/10">
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
          <h2 className="text-sm font-bold text-white">
            {participant.username}
          </h2>
          <p className="text-xs text-emerald-300">Available</p>
        </div>
      </div>
    </header>
  )
}
