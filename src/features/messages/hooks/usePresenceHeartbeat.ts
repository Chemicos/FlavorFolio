import { useEffect, useRef } from "react"
import { updateUserPresenceHeartbeat } from "../services/presence.service"
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "../utils/presence.utils"

export function usePresenceHeartbeat(
  currentUserId?: string | null
) {
  const isWritingRef = useRef(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!currentUserId) return

    let isActive = true

    const stopHeartbeatInterval = () => {
      if (intervalRef.current === null) return

      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const sendHeartbeat = async () => {
      if (
        !isActive ||
        isWritingRef.current ||
        document.visibilityState !== "visible"
      ) {
        return
      }

      try {
        isWritingRef.current = true

        await updateUserPresenceHeartbeat(currentUserId)
      } catch (error) {
        console.error(
          "Failed to update user presence:",
          error
        )
      } finally {
        isWritingRef.current = false
      }
    }

    const startHeartbeatInterval = () => {
      stopHeartbeatInterval()

      intervalRef.current = window.setInterval(() => {
        void sendHeartbeat()
      }, PRESENCE_HEARTBEAT_INTERVAL_MS)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat()
        startHeartbeatInterval()
        return
      }

      stopHeartbeatInterval()
    }

    const handleOnline = () => {
      if (document.visibilityState !== "visible") return

      void sendHeartbeat()
    }

    void sendHeartbeat()

    if (document.visibilityState === "visible") {
      startHeartbeatInterval()
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    )

    window.addEventListener("online", handleOnline)

    return () => {
      isActive = false

      stopHeartbeatInterval()

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )

      window.removeEventListener("online", handleOnline)
    }
  }, [currentUserId])
}