import { useEffect, useState } from "react"
import { fetchConversationParticipants, subscribeToConversations } from "../services/messages.service"
import { Conversation, ConversationParticipant } from "../types/messages.types"

function mergeConversationParticipants({
  conversations,
  freshParticipants,
}: {
  conversations: Conversation[]
  freshParticipants: Record<
    string,
    ConversationParticipant
  >
}): Conversation[] {
  return conversations.map((conversation) => {
    const nextParticipants = {
      ...conversation.participants,
    }

    conversation.participantIds.forEach(
      (participantId) => {
        const freshParticipant =
          freshParticipants[participantId]

        if (!freshParticipant) return

        nextParticipants[participantId] = {
          ...nextParticipants[participantId],
          ...freshParticipant,
        }
      }
    )

    return {
      ...conversation,
      participants: nextParticipants,
    }
  })
}

// export function useConversations(currentUserId?: string | null) {
//     const [conversations, setConversations] = useState<Conversation[]>([])
//     const [isLoading, setIsLoading] = useState(true)
//     const [error, setError] = useState<string | null>(null)

//     useEffect(() => {
//         if (!currentUserId) {
//         setConversations([])
//         setIsLoading(false)
//         return
//         }

//         setIsLoading(true)
//         setError(null)

//         const unsubscribe = subscribeToConversations(
//         currentUserId,
//         (items) => {
//             setConversations(items)
//             setIsLoading(false)
//         },
//         (error) => {
//             console.error("Failed to subscribe to conversations:", error)
//             setError("Failed to load conversations.")
//             setIsLoading(false)
//         }
//         )

//         return unsubscribe
//     }, [currentUserId])

//     return {
//         conversations,
//         isLoading,
//         error,
//     }
// }

export function useConversations(
  currentUserId?: string | null
) {
  const [conversations, setConversations] =
    useState<Conversation[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!currentUserId) {
      setConversations([])
      setIsLoading(false)
      return
    }

    let requestVersion = 0
    let isMounted = true

    setIsLoading(true)
    setError(null)

    const unsubscribe =
      subscribeToConversations(
        currentUserId,

        async (items) => {
          const currentRequest =
            ++requestVersion

          try {
            const participantIds = [
              ...new Set(
                items.flatMap(
                  (conversation) =>
                    conversation.participantIds
                )
              ),
            ]

            const freshParticipants =
              await fetchConversationParticipants(
                participantIds
              )

            if (
              !isMounted ||
              currentRequest !== requestVersion
            ) {
              return
            }

            setConversations(
              mergeConversationParticipants({
                conversations: items,
                freshParticipants,
              })
            )

            setIsLoading(false)
          } catch (error) {
            console.error(
              "Failed to fetch current participant profiles:",
              error
            )

            if (
              !isMounted ||
              currentRequest !== requestVersion
            ) {
              return
            }

            /*
             * Conversațiile rămân utilizabile chiar dacă
             * fetch-ul profilurilor eșuează.
             */
            setConversations(items)
            setIsLoading(false)
          }
        },

        (error) => {
          console.error(
            "Failed to subscribe to conversations:",
            error
          )

          if (!isMounted) return

          setError(
            "Failed to load conversations."
          )

          setIsLoading(false)
        }
      )

    return () => {
      isMounted = false
      requestVersion += 1
      unsubscribe()
    }
  }, [currentUserId])

  return {
    conversations,
    isLoading,
    error,
  }
}