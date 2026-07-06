import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { useState } from "react"
import { sendMessage } from "../services/messages.service"

interface MessageComposerProps {
  conversationId: string
  senderId: string
  receiverId: string
}

export default function MessageComposer({
  conversationId,
  senderId,
  receiverId,
}: MessageComposerProps) {
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!text.trim() || isSending) return

    try {
      setIsSending(true)

      await sendMessage({
        conversationId,
        senderId,
        receiverId,
        text,
      })

      setText("")
    } finally {
      setIsSending(false)
    }
  }
  
  return (
    <footer className="shrink-0 border-t border-white/10 bg-[#16181d]/95 px-6 py-4">
      <div className="flex  items-end gap-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          placeholder="Message..."
          rows={1}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-[#0b0b0c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-[#feaa2b]/20 focus:border-[#feaa2b]/50 focus:ring-2 focus:ring-[#feaa2b]/10"
        />

        <button
          type="button"
          disabled={!text.trim() || isSending}
          onClick={handleSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#feaa2b] text-[#0d0e11] transition hover:bg-[#ffc15c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>
    </footer>
  )
}
