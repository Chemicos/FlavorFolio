import { useEffect, useMemo, useState } from "react"
import { deleteNotification, FlavorFolioNotification, markAllNotificationsAsRead, markNotificationAsRead, subscribeToUserNotifications } from "../services/notifications.service"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export function useNotifications(limitCount = 20) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<FlavorFolioNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null)

      if (!user) {
        setNotifications([])
        setIsLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeToUserNotifications({
      userId: currentUserId,
      limitCount,
      onChange: (nextNotifications) => {
        setNotifications(nextNotifications)
        setIsLoading(false)
      },
      onError: (error) => {
        console.error("Failed to load notifications:", error)
        setError("Failed to load notifications.")
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [currentUserId, limitCount])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUserId) return

    await markNotificationAsRead({
      userId: currentUserId,
      notificationId,
    })
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return

    await markAllNotificationsAsRead({
      userId: currentUserId,
      notifications,
    })
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUserId) return

    await deleteNotification({
      userId: currentUserId,
      notificationId,
    })
  }

  return {
    currentUserId,
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
  }
}