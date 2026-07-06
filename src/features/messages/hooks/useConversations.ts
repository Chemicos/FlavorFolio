import { useEffect, useState } from "react"
import { subscribeToConversations } from "../services/messages.service"
import { Conversation } from "../types/messages.types"

export function useConversations(currentUserId?: string | null) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!currentUserId) {
        setConversations([])
        setIsLoading(false)
        return
        }

        setIsLoading(true)
        setError(null)

        const unsubscribe = subscribeToConversations(
        currentUserId,
        (items) => {
            setConversations(items)
            setIsLoading(false)
        },
        (error) => {
            console.error("Failed to subscribe to conversations:", error)
            setError("Failed to load conversations.")
            setIsLoading(false)
        }
        )

        return unsubscribe
    }, [currentUserId])

    return {
        conversations,
        isLoading,
        error,
    }
}