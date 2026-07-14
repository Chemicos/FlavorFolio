import { doc, onSnapshot, serverTimestamp, Timestamp, updateDoc } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export interface UserPresenceData {
  lastSeenAt: Timestamp | null
}

export async function updateUserPresenceHeartbeat(
  userId: string
): Promise<void> {
  if (!userId) return

  await updateDoc(doc(db, "users", userId), {
    lastSeenAt: serverTimestamp(),
  })
}

export function subscribeToUserPresence({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (presence: UserPresenceData) => void
  onError?: (error: Error) => void
}) {
  return onSnapshot(
    doc(db, "users", userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange({
          lastSeenAt: null,
        })

        return
      }

      const data = snapshot.data()
      const lastSeenAt = data.lastSeenAt

      onChange({
        lastSeenAt:
          lastSeenAt &&
          typeof lastSeenAt.toMillis === "function"
            ? lastSeenAt
            : null,
      })
    },
    onError
  )
}