import { doc, onSnapshot } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../../firebase-config"

export function useCanMessageUser(
    currentUserId: string | null,
    targetUserId: string | null
) {
    const [canMessage, setCanMessage] = useState(false)
    const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setCanMessage(false)
      setIsChecking(false)
      return
    }

    setIsChecking(true)

    let currentFollowsTarget = false
    let targetFollowsCurrent = false

    const updateState = () => {
      setCanMessage(currentFollowsTarget && targetFollowsCurrent)
      setIsChecking(false)
    }

    const unsubscribeCurrent = onSnapshot(
      doc(db, "users", currentUserId, "following", targetUserId),
      (snapshot) => {
        currentFollowsTarget = snapshot.exists()
        updateState()
      }
    )

    const unsubscribeTarget = onSnapshot(
      doc(db, "users", targetUserId, "following", currentUserId),
      (snapshot) => {
        targetFollowsCurrent = snapshot.exists()
        updateState()
      }
    )

    return () => {
      unsubscribeCurrent()
      unsubscribeTarget()
    }
  }, [currentUserId, targetUserId])

  return {
    canMessage,
    isChecking,
  }
}