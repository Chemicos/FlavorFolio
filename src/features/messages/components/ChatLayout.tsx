import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useConversationMessages } from "../hooks/useConversationMessages"
import { useConversations } from "../hooks/useConversations"
import ChatHeader from "./ChatHeader"
import ConversationList from "./ConversationList"
import MessageBubble from "./MessageBubble"
import MessageComposer from "./MessageComposer"
import { deleteMessage, markConversationAsRead } from "../services/messages.service"
import { useCanMessageUser } from "../hooks/useCanMessageUser"
import MessageImagePreviewModal from "./MessageImagePreviewModal"
import { useUserPresence } from "../hooks/useUserPresence"

interface ChatLayoutProps {
  currentUserId: string
  activeConversationId: string | null
}

export default function ChatLayout({
  currentUserId,
  activeConversationId,
}: ChatLayoutProps) {
  const { conversations, isLoading } = useConversations(currentUserId)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const shouldForceBottomRef = useRef(false)

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const activeConversation =
    conversations.find((item) => item.conversationId === activeConversationId) ||
    null

  const { messages } = useConversationMessages({
    conversationId: activeConversationId,
    currentUserId,
  })

  const otherUserId = activeConversation?.participantIds.find(
    (id) => id !== currentUserId
  )

  const otherUser = otherUserId ? activeConversation?.participants?.[otherUserId] : null

  const {
    isOnline: isOtherUserOnline,
    statusLabel: otherUserStatusLabel,
    isLoading: isPresenceLoading,
  } = useUserPresence(otherUserId)

  const { canMessage, isChecking } = useCanMessageUser(
    currentUserId,
    otherUserId || null
  )

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
          behavior,
          block: "end",
        })
      })
    })
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const distance =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight

      setIsNearBottom(distance < 150)
    }

    container.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => container.removeEventListener("scroll", handleScroll)
  }, [activeConversationId, activeConversation])

  useLayoutEffect(() => {
    shouldForceBottomRef.current = true
    setIsNearBottom(true)
    scrollToBottom("auto")
  }, [activeConversationId])
  
  useEffect(() => {
    if (!messages.length) return

    if (shouldForceBottomRef.current) {
      scrollToBottom("auto")

      const timeout = window.setTimeout(() => {
        scrollToBottom("auto")
        shouldForceBottomRef.current = false
      }, 150)

      return () => window.clearTimeout(timeout)
    }

    if (isNearBottom) {
      scrollToBottom("smooth")
    }
  }, [messages.length, activeConversationId])
    
  const lastMessage = messages[messages.length - 1]

  useEffect(() => {
    if (!activeConversationId || !lastMessage) return
    if (lastMessage.senderId === currentUserId) return

    markConversationAsRead({
      conversationId: activeConversationId,
      userId: currentUserId,
    }).catch((error) => {
      console.error("Failed to mark conversation as read:", error)
    })
  }, [activeConversationId, currentUserId, lastMessage?.messageId])

  const lastReadAtByOtherUser = otherUserId
    ? activeConversation?.lastReadAt?.[otherUserId]
    : null

  const lastReadAtByOtherUserMs =
    typeof lastReadAtByOtherUser?.toDate === "function"
      ? lastReadAtByOtherUser.toDate().getTime()
      : 0

  const lastOwnMessageIdSeenByOtherUser = useMemo(() => {
    if (!lastReadAtByOtherUserMs) return null

    const seenOwnMessages = messages.filter((message) => {
      if (message.senderId !== currentUserId) return false
      if (typeof message.createdAt?.toDate !== "function") return false

      return message.createdAt.toDate().getTime() <= lastReadAtByOtherUserMs
    })

    return seenOwnMessages.at(-1)?.messageId || null
  }, [messages, currentUserId, lastReadAtByOtherUserMs])

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversationId) return

    try {
      await deleteMessage({
        conversationId: activeConversationId,
        messageId,
        currentUserId,
      })
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
  }
  return (
    <main className="fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-[#0d0e11]">
      <div className="grid h-full w-full grid-cols-[360px_minmax(0,1fr)] overflow-hidden">
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          activeConversationId={activeConversationId}
          isLoading={isLoading}
        />

        <section className="flex h-full min-h-0 min-w-0 flex-col border-l border-white/10 bg-[#111216] overflow-hidden">
          {activeConversation && otherUserId && otherUser ? (
            <>
              <ChatHeader 
                participant={otherUser} 
                isOnline={isOtherUserOnline}
                statusLabel={
                  isPresenceLoading
                    ? "Checking status..."
                    : otherUserStatusLabel
                }
              />

              <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                <div className="flex flex-col gap-3">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.messageId}
                      message={message}
                      isOwn={message.senderId === currentUserId}
                      isSeen={message.messageId === lastOwnMessageIdSeenByOtherUser}
                      onDelete={message.senderId === currentUserId ? () => handleDeleteMessage(message.messageId) : undefined}
                      onOpenImage={setPreviewImageUrl}
                    />
                  ))}

                  <div ref={bottomRef} />
                </div>
              </div>

              <MessageComposer
                conversationId={activeConversation.conversationId}
                senderId={currentUserId}
                receiverId={otherUserId}
                disabled={!isChecking && !canMessage}
                disabledReason="You can’t send messages unless you follow each other."
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#feaa2b]/10 text-2xl text-[#feaa2b]">
                  <ChatBubbleOutlineRoundedIcon />
                </div>
                <h2 className="mt-5 text-xl font-bold text-white">
                  Select a conversation
                </h2>
                <p className="mt-2 text-sm text-[#8f97b1]">
                  Choose a chat from the left sidebar to start messaging.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <MessageImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </main>
  )
}
