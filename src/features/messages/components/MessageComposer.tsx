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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  
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

  const resizeTextarea = () => {
    const textarea = textareaRef.current

    if (!textarea) return

    const computedStyles = window.getComputedStyle(textarea)
    const lineHeight = Number.parseFloat(computedStyles.lineHeight) || 24
    const verticalPadding = Number.parseFloat(computedStyles.paddingTop) + Number.parseFloat(computedStyles.paddingBottom)

    const maxHeight = lineHeight * 5 + verticalPadding

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight
        ? "auto"
        : "hidden"
  }

  const resetTextarea = () => {
    setText("")

    requestAnimationFrame(() => {
      const textarea = textareaRef.current

      if (!textarea) return

      textarea.style.height = "auto"
      textarea.style.overflowY = "hidden"
    })
  }

  const handleTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setText(event.target.value)
    resizeTextarea()
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
        resetTextarea()
        return
      }

      await sendMessage({
        conversationId,
        senderId,
        receiverId,
        text,
      })

      resetTextarea()
    } finally {
      setIsSending(false)
    }
  }
  
  return (
    <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
      {disabled && disabledReason && (
        <div className="mb-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning-text)]">
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

      <div className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] p-2 transition-within:border-[var(--focus-border)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)] hover:border-[var(--accent-border)]">
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
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--button-danger-border)] bg-[var(--button-danger-bg)] text-[var(--button-danger-text)] shadow-[var(--shadow-card)] transition hover:bg-[var(--button-danger-hover)]"
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          disabled={disabled}
          onChange={handleTextChange}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          rows={1}
          placeholder={disabled ? "Messaging unavailable..." : "Message..."}
          className="min-h-[44px] w-full resize-none overflow-y-hidden bg-transparent px-2 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--input-placeholder)] disabled:cursor-not-allowed disabled:opacity-50
          [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={disabled || isSending}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--hover)] hover:text-[var(--accent-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AttachFileRoundedIcon sx={{ fontSize: 20 }} />
          </button>

          <button
            type="button"
            disabled={!canSend || isSending || disabled}
            onClick={handleSend}
            className="flex h-10 min-w-[86px] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm text-[var(--text-on-accent)] transition hover:bg-[var(--accent-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
            <SendRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </footer>
  )
}
