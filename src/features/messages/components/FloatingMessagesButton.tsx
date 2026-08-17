import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { useMemo, useState } from "react"
import { auth } from "../../../firebase-config"
import { useConversations } from "../hooks/useConversations"
import FloatingMessagesPanel from "./FloatingMessagesPanel"
import { useLocation } from "react-router-dom"

interface FloatingMessagesButtonProps {
  rightOffset?: number
}

const hiddenRoutes = [
  "/messages",
  "/needs-revision",
  "/pending",
  "/admin/recipes",
  "/admin/users",
  "/admin/reports",
]

export default function FloatingMessagesButton({rightOffset = 24,}: FloatingMessagesButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentUserId = auth.currentUser?.uid || null
  const location = useLocation()
  const { conversations } = useConversations(currentUserId)

  const isMessagesPage = location.pathname.startsWith("/messages")
  const shouldHide = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  )
  
  const unreadTotal = useMemo(() => {
    if (!currentUserId) return 0

    return conversations.reduce((sum, conversation) => {
      return sum + Number(conversation.unreadCount?.[currentUserId] || 0)
    }, 0)
  }, [conversations, currentUserId])
  if (!currentUserId || isMessagesPage || shouldHide) return null

  return (
    <>
      <button
        type="button"
        style={{right: rightOffset}}
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-full border px-5 shadow-[var(--shadow-dropdown)] transition-[right,background-color,border-color,color,transform] duration-200 active:scale-95",
          isOpen
            ? "border-[var(--accent-border)] bg-[var(--button-secondary-hover)] text-[var(--accent-text)]"
            : "border-[var(--border)] bg-[var(--account-dropdown-bg)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--button-secondary-hover)]",
        ].join(" ")}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full transition">
          {isOpen ? (
            <CloseRoundedIcon sx={{ fontSize: 21 }} />
          ) : (
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 21 }} />
          )}

          {unreadTotal > 0 && !isOpen && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.68rem] font-bold text-[var(--text-on-accent)] shadow-[0_0_14px_var(--accent-soft-hover)]">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          )}
        </span>

        <span className="hidden text-sm font-semibold sm:inline">
          Messages
        </span>
      </button>

      <FloatingMessagesPanel
        isOpen={isOpen}
        currentUserId={currentUserId}
        conversations={conversations}
        onClose={() => setIsOpen(false)}
        rightOffset={rightOffset}
      />
    </>
  )
}
