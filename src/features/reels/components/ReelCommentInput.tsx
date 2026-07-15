import { CircularProgress } from "@mui/material"
import SendRoundedIcon from "@mui/icons-material/SendRounded"

import { KeyboardEvent, FormEvent, useState } from "react"

interface ReelCommentInputProps {
  profileImage?: string
  isSubmitting: boolean
  isAuthenticated: boolean
  onSubmit: (text: string) => Promise<void>
}

const MAX_COMMENT_LENGTH = 500

export default function ReelCommentInput({
  profileImage,
  isSubmitting,
  isAuthenticated,
  onSubmit,
}: ReelCommentInputProps) {
  const [value, setValue] = useState("")

  const normalizedValue = value.trim()
  const canSubmit =
    isAuthenticated &&
    Boolean(normalizedValue) &&
    !isSubmitting

  async function handleSubmit(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault()

    if (!canSubmit) return

    await onSubmit(normalizedValue)
    setValue("")
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/10 bg-[#1b1d22] p-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
          {profileImage ? (
            <img
              src={profileImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#a8b3cf]">
              U
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 transition focus-within:border-[#feaa2b]/50 focus-within:bg-white/[0.05]">
          <textarea
            value={value}
            onChange={(event) =>
              setValue(
                event.target.value.slice(
                  0,
                  MAX_COMMENT_LENGTH
                )
              )
            }
            onKeyDown={handleKeyDown}
            disabled={!isAuthenticated || isSubmitting}
            rows={1}
            placeholder={
              isAuthenticated
                ? "Add a comment..."
                : "Sign in to comment"
            }
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-[#737b94] disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#feaa2b] transition hover:bg-[#feaa2b]/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Publish comment"
          >
            {isSubmitting ? (
              <CircularProgress
                size={16}
                sx={{ color: "#feaa2b" }}
              />
            ) : (
              <SendRoundedIcon
                sx={{ fontSize: 19 }}
              />
            )}
          </button>
        </div>
      </div>

      {value.length > 400 && (
        <p className="mt-2 text-right text-xs text-[#737b94]">
          {value.length}/{MAX_COMMENT_LENGTH}
        </p>
      )}
    </form>
  )
}
