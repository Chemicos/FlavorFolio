import { useEffect, useState } from "react"
import { ChatMessage } from "../types/messages.types"
import { markConversationAsRead, subscribeToConversationMessages } from "../services/messages.service"

export function useConversationMessages({
    conversationId,
    currentUserId,
}: {
    conversationId?: string | null
    currentUserId?: string | null
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!conversationId || !currentUserId) {
            setMessages([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        markConversationAsRead({ conversationId, userId: currentUserId }).catch(console.error)

        const unsubscribe = subscribeToConversationMessages(
            conversationId,
            (items) => {
                setMessages(items)
                setIsLoading(false)
            },
            (error) => {
                console.error("Failed to subscribe to messages:", error)
                setError("Failed to load messages.")
                setIsLoading(false)
            }
        )

        return unsubscribe
    }, [conversationId, currentUserId])

    return {
        messages,
        isLoading,
        error,
    }
}