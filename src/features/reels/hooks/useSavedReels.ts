import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { subscribeToSavedReelIds } from "../services/reelSave.service"

export function useSavedReels() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [savedReelIds, setSavedReelIds] = useState<string[]>([])

  useEffect(() => {
    const auth = getAuth()
    let unsubscribeSavedReels: (() => void) | undefined

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeSavedReels?.()

      if (!user) {
        setCurrentUserId(null)
        setSavedReelIds([])
        return
      }

      setCurrentUserId(user.uid)

      unsubscribeSavedReels = subscribeToSavedReelIds({
        userId: user.uid,
        onChange: setSavedReelIds,
        onError: (error) => {
          console.error("Failed to subscribe to saved reels:", error)
        },
      })
    })

    return () => {
      unsubscribeAuth()
      unsubscribeSavedReels?.()
    }
  }, [])

  return {
    currentUserId,
    savedReelIds,
  }
}