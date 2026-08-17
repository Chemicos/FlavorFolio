import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { subscribeToLikedReelIds } from "../services/reelLikes.service"

export function useLikedReels() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [likedReelIds, setLikedReelIds] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()

    let unsubscribeLikedReels:
      | (() => void)
      | undefined

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeLikedReels?.()

        if (!user) {
          setCurrentUserId(null)
          setLikedReelIds([])
          setIsLoading(false)
          return
        }

        setCurrentUserId(user.uid)
        setIsLoading(true)

        unsubscribeLikedReels =
          subscribeToLikedReelIds({
            userId: user.uid,

            onChange: (reelIds) => {
              setLikedReelIds(reelIds)
              setIsLoading(false)
            },

            onError: (error) => {
              console.error(
                "Failed to subscribe to liked reels:",
                error
              )

              setLikedReelIds([])
              setIsLoading(false)
            },
          })
      }
    )

    return () => {
      unsubscribeAuth()
      unsubscribeLikedReels?.()
    }
  }, [])

  return {
    currentUserId,
    likedReelIds,
    isLoading,
  }
}