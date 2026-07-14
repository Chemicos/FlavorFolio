import { useEffect, useMemo, useState } from "react"
import { formatLastSeen, isUserOnline } from "../utils/presence.utils"
import { subscribeToUserPresence } from "../services/presence.service"
import { Timestamp } from "@firebase/firestore"

interface UseUserPresenceResult {
  lastSeenAt: Timestamp | null
  isOnline: boolean
  statusLabel: string
  isLoading: boolean
}

export function useUserPresence(
  userId?: string | null
): UseUserPresenceResult {
  const [lastSeenAt, setLastSeenAt] =
    useState<Timestamp | null>(null)

  const [isLoading, setIsLoading] = useState(
    Boolean(userId)
  )

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!userId) {
      setLastSeenAt(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = subscribeToUserPresence({
      userId,

      onChange: ({ lastSeenAt }) => {
        setLastSeenAt(lastSeenAt)
        setNow(Date.now())
        setIsLoading(false)
      },

      onError: (error) => {
        console.error(
          "Failed to subscribe to user presence:",
          error
        )

        setLastSeenAt(null)
        setIsLoading(false)
      },
    })

    return unsubscribe
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [userId])

  return useMemo(
    () => ({
      lastSeenAt,
      isOnline: isUserOnline({
        lastSeenAt,
        now,
      }),
      statusLabel: formatLastSeen({
        lastSeenAt,
        now,
      }),
      isLoading,
    }),
    [lastSeenAt, now, isLoading]
  )
}