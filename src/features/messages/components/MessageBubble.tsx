import { ChatMessage } from "../types/messages.types"

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  isSeen?: boolean
}

function formatTime(value: any) {
  if (!value?.toDate) return ""

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value.toDate())
}


export default function MessageBubble({message, isOwn, isSeen = false,}: MessageBubbleProps) {
  return (
    <div className={["flex flex-col", isOwn ? "items-end" : "items-start"].join(" ")}>
      <div
        className={[
          "max-w-[68%] rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
          isOwn
            ? "rounded-br-md bg-[#feaa2b] text-[#0d0e11]"
            : "rounded-bl-md border border-white/10 bg-[#0b0b0c] text-[#d7def0]",
        ].join(" ")}
      >
        <p className="whitespace-pre-wrap text-sm leading-6">
          {message.isDeleted ? "Message deleted." : message.text}
        </p>

        <p
          className={[
            "mt-1 text-right text-[0.65rem]",
            isOwn ? "text-[#3b2a10]" : "text-[#7f89a6]",
          ].join(" ")}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>

      {isOwn && isSeen && (
        <span className="mt-1 pr-1 text-[0.68rem] font-medium text-[#8f97b1]">
          Seen
        </span>
      )}
    </div>
  )
}
