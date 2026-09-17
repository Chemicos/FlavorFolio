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
import ScrollToBottomButton from "./ScrollToBottomButton"
import MessageDateDivider from "./MessageDateDivider"
import { fetchReelById } from "../../reels/services/reels.service"
import { Reel } from "../../reels/types/reel.types"
import ViewReelDrawer from "../../reels/components/ViewReelDrawer"
import { useLikedReels } from "../../reels/hooks/useLikedReels"
import { useSavedReels } from "../../reels/hooks/useSavedReels"
import { AnimatePresence, motion } from "motion/react"
import ReelCommentModal from "../../reels/components/ReelCommentModal"
import { CircularProgress } from "@mui/material"
import { createPortal } from "react-dom"
import { useSnackbar } from "../../../components/layout/SnackbarProvider"
import ShareRecipeModal from "./ShareRecipeModal"

interface ChatLayoutProps {
  currentUserId: string
  activeConversationId: string | null
}

function getDateFromValue(value: unknown): Date | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("toDate" in value) ||
    typeof (value as { toDate?: unknown }).toDate !== "function"
  ) {
    return null
  }

  return (value as { toDate: () => Date }).toDate()
}

function isSameCalendarDay(firstValue: unknown, secondValue: unknown) {
  const firstDate = getDateFromValue(firstValue)
  const secondDate = getDateFromValue(secondValue)

  if (!firstDate || !secondDate) return false

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

function formatMessageDividerDate(value: unknown) {
  const date = getDateFromValue(value)

  if (!date) return ""

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
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
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const [commentsReel, setCommentsReel] = useState<Reel | null>(null)
  const [reelToShare, setReelToShare] = useState<Reel | null>(null)
  const [isReelDrawerLoading, setIsReelDrawerLoading] = useState(false)

  const {likedReelIds} = useLikedReels()
  const {savedReelIds} = useSavedReels()
  const {showSnackbar} = useSnackbar()

  const SCROLL_BOTTOM_THRESHOLD = 150

  const activeConversation = conversations.find((item) => item.conversationId === activeConversationId) || null

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

  const handleScrollToBottom = () => {
    setIsNearBottom(true)
    scrollToBottom("smooth")
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const distance =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight

      setIsNearBottom(distance < SCROLL_BOTTOM_THRESHOLD)
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
  }, [messages.length, activeConversationId, isNearBottom])
    
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

  const handleOpenSharedReel = async (reelId: string) => {
    if (!reelId || isReelDrawerLoading) return

    try {
      setIsReelDrawerLoading(true)

      const reel = await fetchReelById(reelId)

      if (!reel) {
        console.error("Shared reel no longer exists.")
        return
      }

      if (
        reel.status !== "published" ||
        reel.visibility !== "public"
      ) {
        console.error("Shared reel is no longer available.")
        return
      }

      setSelectedReel(reel)
    } catch (error) {
      console.error("Failed to open shared reel:", error)
    } finally {
      setIsReelDrawerLoading(false)
    }
  }

  const handleOpenShareReel = (reel: Reel) => {
    setReelToShare({
      reelId: reel.reelId,
      title: reel.title || "Recipe reel",
      description: reel.description || "",
      videoUrl: reel.videoUrl || "",
      thumbnail: reel.thumbnail || "",
      authorUsername: reel.author?.username || "Unknown",
      meal: reel.meal || "",
      durationSeconds: Number(reel.duration || 0),
    })
  }

  const handleReelLikeStateChange = (
    reelId: string,
    _isLiked: boolean,
    likesCount: number
  ) => {
    setSelectedReel((prev) => {
      if (!prev || prev.reelId !== reelId) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          likesCount: Number(likesCount || 0),
        },
      }
    })

    setCommentsReel((prev) => {
      if (!prev || prev.reelId !== reelId) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          likesCount: Number(likesCount || 0),
        },
      }
    })
  }

  const handleReelSaveStateChange = (
    reelId: string,
    _isSaved: boolean,
    savesCount: number
  ) => {
    setSelectedReel((prev) => {
      if (!prev || prev.reelId !== reelId) return prev

      return {
        ...prev,
        stats: {
          ...prev.stats,
          savesCount: Number(savesCount || 0),
        },
      }
    })
  }
  return (
    <main className="fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-[var(--bg-primary)]">
      <div className="grid h-full w-full grid-cols-[360px_minmax(0,1fr)] overflow-hidden">
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          activeConversationId={activeConversationId}
          isLoading={isLoading}
        />

        <section className="flex h-full min-h-0 min-w-0 flex-col border-l border-[var(--border)] bg-[var(--bg-tertiary)] overflow-hidden">
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

              <div className="relative min-h-0 flex-1">
                <div ref={messagesContainerRef} className="h-full overflow-y-auto px-6 py-6 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
                  <div className="flex flex-col gap-3">
                    {messages.map((message, index) => {
                      const previousMessage = messages[index - 1]

                      const shouldShowDateDivider =
                        index === 0 ||
                        !isSameCalendarDay(
                          message.createdAt,
                          previousMessage?.createdAt
                        )

                      const isSeen =
                        message.messageId ===
                        lastOwnMessageIdSeenByOtherUser

                      return (
                        <div key={message.messageId}>
                          {shouldShowDateDivider && (
                            <MessageDateDivider
                              label={formatMessageDividerDate(
                                message.createdAt
                              )}
                            />
                          )}

                          <MessageBubble
                            message={message}
                            isOwn={message.senderId === currentUserId}
                            isSeen={isSeen}
                            seenAt={isSeen ? lastReadAtByOtherUser : null}
                            onDelete={
                              message.senderId === currentUserId
                                ? () => handleDeleteMessage(message.messageId)
                                : undefined
                            }
                            onOpenImage={setPreviewImageUrl}
                            onOpenReel={handleOpenSharedReel}
                          />
                        </div>
                      )
                    })}

                    <div ref={bottomRef} />
                  </div>
                </div>

                <ScrollToBottomButton
                  isVisible={!isNearBottom && messages.length > 0}
                  onClick={handleScrollToBottom}
                />
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
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-2xl text-[var(--accent)]">
                  <ChatBubbleOutlineRoundedIcon />
                </div>
                <h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
                  Select a conversation
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
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

      {createPortal(
         <AnimatePresence>
          {(selectedReel || isReelDrawerLoading) && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-5 backdrop-blur-[2px]"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2, ease: "easeOut"}}
              onClick={(event) => {
                if (
                  event.target === event.currentTarget &&
                  !isReelDrawerLoading
                ) {
                  setSelectedReel(null)
                }
              }}
            >
              {isReelDrawerLoading ? (
                <CircularProgress
                  size={34}
                  thickness={4.5}
                  sx={{color: "var(--accent)"}}
                />
              ) : selectedReel ? (
                <ViewReelDrawer
                  reel={selectedReel}
                  currentUserId={currentUserId}
                  isLiked={likedReelIds.includes(selectedReel.reelId)}
                  isSaved={savedReelIds.includes(selectedReel.reelId)}
                  onClose={() => setSelectedReel(null)}
                  onCommentsClick={setCommentsReel}
                  onShareClick={handleOpenShareReel}
                  onLikeStateChange={handleReelLikeStateChange}
                  onSaveStateChange={handleReelSaveStateChange}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}
      

      {createPortal(
        <AnimatePresence>
          {commentsReel && (
            <ReelCommentModal
              reel={commentsReel}
              onClose={() => setCommentsReel(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <ShareRecipeModal
          isOpen={Boolean(reelToShare)}
          currentUserId={currentUserId}
          reel={reelToShare}
          onClose={() => setReelToShare(null)}
          onShared={(username) => {
            showSnackbar(`Reel shared with ${username}.`, "success")
            setReelToShare(null)
          }}
        />,
        document.body
      )}
    </main>
  )
}
