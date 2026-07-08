import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { useMemo, useState } from "react"
import { auth } from "../../../firebase-config"
import { useConversations } from "../hooks/useConversations"
import FloatingMessagesPanel from "./FloatingMessagesPanel"
import { useLocation } from "react-router-dom"

const hiddenRoutes = [
  "/messages",
  "/needs-revision",
  "/pending",
  "/admin/recipes",
  "/admin/users",
  "/admin/reports",
]

export default function FloatingMessagesButton() {
  const [isOpen, setIsOpen] = useState(false)
  const currentUserId = auth.currentUser?.uid || null

  const location = useLocation()
  const isMessagesPage = location.pathname.startsWith("/messages")

  if (!currentUserId || isMessagesPage) return null

  const { conversations } = useConversations(currentUserId)

  const shouldHide = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  )

  const unreadTotal = useMemo(() => {
    if (!currentUserId) return 0

    return conversations.reduce((sum, conversation) => {
      return sum + Number(conversation.unreadCount?.[currentUserId] || 0)
    }, 0)
  }, [conversations, currentUserId])
  
  if (shouldHide) return null
  if (!currentUserId) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "fixed bottom-6 right-6 z-40 flex h-14 items-center gap-3 rounded-full border px-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition active:scale-95",
          isOpen
            ? "border-[#feaa2b]/30 bg-[#feaa2b]/10 text-[#ffd28a]"
            : "border-white/10 bg-[#0b0b0c]/90 text-[#d7def0] hover:bg-[#16181d]",
        ].join(" ")}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05]">
          {isOpen ? (
            <CloseRoundedIcon sx={{ fontSize: 21 }} />
          ) : (
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 21 }} />
          )}

          {unreadTotal > 0 && !isOpen && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#feaa2b] text-[#0d0e11] px-1 text-[0.68rem] font-bold">
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
      />
    </>
  )
}
