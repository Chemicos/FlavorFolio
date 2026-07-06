import { useNavigate } from "react-router-dom"
import { createOrOpenDirectConversation } from "../services/messages.service"
import { useState } from "react"

export function useStartConversation(currentUserId?: string | null) {
    const navigate = useNavigate()
    const [isStarting, setIsStarting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const startConversation = async (targetUserId: string) => {
        if (!currentUserId) return

        try {
            setIsStarting(true)
            setError(null)

            const conversationId = await createOrOpenDirectConversation({
                currentUserId,
                targetUserId,
            })

            navigate(`/messages/${conversationId}`)
        } catch (error) {
            console.error("Failed to start conversation:", error)
            setError("You cannot message this user.")
        } finally {
            setIsStarting(false)
        }
    }

    return {
        startConversation,
        isStarting,
        error,
    }
}