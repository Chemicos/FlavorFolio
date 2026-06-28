import { collection, doc, getDoc, onSnapshot, query } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export type ProfileConnectionType = "followers" | "following"

export interface ProfileConnectionUser {
  uid: string
  username: string
  profileImage: string
  followedAt?: {
    seconds: number
    nanoseconds: number
  }
}

export function subscribeToProfileConnections({
  userId,
  type,
  onChange,
  onError,
}: {
  userId: string
  type: ProfileConnectionType
  onChange: (users: ProfileConnectionUser[]) => void
  onError: (error: Error) => void
}) {
  const connectionsQuery = query(collection(db, "users", userId, type))

  return onSnapshot(
    connectionsQuery,
    async (snapshot) => {
      try {
        const users = await Promise.all(
          snapshot.docs.map(async (connectionDoc) => {
            const connectedUserId = connectionDoc.id
            const userSnap = await getDoc(doc(db, "users", connectedUserId))
            const userData = userSnap.exists() ? userSnap.data() : {}
            const connectionData = connectionDoc.data()

            return {
                uid: connectedUserId,
                username: userData.username || "User",
                profileImage: userData.profileImage || connectionData.profileImageUrl || "",
                followedAt: connectionData.followedAt || connectionData.createdAt || undefined,
            }
          })
        )

        onChange(users)
      } catch (error) {
        onError(error as Error)
      }
    },
    onError
  )
}