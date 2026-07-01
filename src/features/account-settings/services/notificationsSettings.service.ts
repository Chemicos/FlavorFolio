import { doc, onSnapshot, serverTimestamp, updateDoc } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export interface NotificationPreferences {
  newFollowers: boolean
  followRequests: boolean
  recipeRatings: boolean
  recipeComments: boolean
  commentReplies: boolean
  recipeSaves: boolean
  recipeApproved: boolean
  recipeRejected: boolean
  adminFeedback: boolean
  directMessages: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  newFollowers: true,
  followRequests: false,
  recipeRatings: true,
  recipeComments: false,
  commentReplies: false,
  recipeSaves: false,
  recipeApproved: false,
  recipeRejected: false,
  adminFeedback: false,
  directMessages: false,
}

export function subscribeToNotificationPreferences({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (settings: NotificationPreferences) => void
  onError: (error: Error) => void
}) {
  const userRef = doc(db, "users", userId)

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onError(new Error("User profile not found."))
        return
      }

      const data = snapshot.data()

      onChange({
        ...defaultNotificationPreferences,
        ...(data.notificationPreferences || {}),
      })
    },
    onError
  )
}

export async function updateNotificationPreference({
  userId,
  key,
  value,
}: {
  userId: string
  key: keyof NotificationPreferences
  value: boolean
}) {
  await updateDoc(doc(db, "users", userId), {
    [`notificationPreferences.${key}`]: value,
    updatedAt: serverTimestamp(),
  })
}
