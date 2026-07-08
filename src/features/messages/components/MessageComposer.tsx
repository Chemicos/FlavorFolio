import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { useRef, useState } from "react"
import { sendImageMessage, sendMessage } from "../services/messages.service"

interface MessageComposerProps {
  conversationId: string
  senderId: string
  receiverId: string
  disabled?: boolean
  disabledReason?: string
}

export default function MessageComposer({
  conversationId,
  senderId,
  receiverId,
  disabled = false,
  disabledReason,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const [text, setText] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [isSending, setIsSending] = useState(false)

  const canSend = Boolean(text.trim() || selectedImage)

  const handleSelectImage = (file?: File) => {
    if (!file) return

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleClearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSelectedImage(null)
    setPreviewUrl("")
  }

  const handleSend = async () => {
    if (!canSend || isSending || disabled) return

    try {
      setIsSending(true)

      if (selectedImage) {
        await sendImageMessage({
          conversationId,
          senderId,
          receiverId,
          file: selectedImage,
          text,
        })

        handleClearImage()
        setText("")
        return
      }

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
      {disabled && disabledReason && (
        <div className="mb-3 rounded-xl border border-orange-400/15 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
          {disabledReason}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          handleSelectImage(event.target.files?.[0])
          event.target.value = ""
        }}
      />

      <div className="rounded-2xl border border-white/10 bg-[#0b0b0c] p-2 transition-within:border-[#feaa2b]/50 focus-within:ring-2 focus-within:ring-[#feaa2b]/10 hover:border-[#feaa2b]/20">
        {previewUrl && (
          <div className="relative mb-2 w-fit">
            <img
              src={previewUrl}
              alt="Selected attachment"
              className="h-28 w-28 rounded-xl object-cover"
            />

            <button
              type="button"
              onClick={handleClearImage}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#16181d] text-white transition hover:bg-red-600/80 hover:text-red-200"
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        )}

        <textarea
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          rows={1}
          placeholder={disabled ? "Messaging unavailable..." : "Message..."}
          className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-[#6f7892] disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={disabled || isSending}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#a8b3cf] transition hover:bg-white/[0.06] hover:text-[#ffd28a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AttachFileRoundedIcon sx={{ fontSize: 20 }} />
          </button>

          <button
            type="button"
            disabled={!canSend || isSending || disabled}
            onClick={handleSend}
            className="flex h-10 min-w-[86px] items-center justify-center gap-2 rounded-xl bg-[#feaa2b] px-4 text-sm font-semibold text-[#0d0e11] transition hover:bg-[#ffc15c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
            <SendRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </footer>
  )
}
