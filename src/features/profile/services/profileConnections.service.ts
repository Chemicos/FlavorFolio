import { collection, doc, getDoc, increment, onSnapshot, query, serverTimestamp, writeBatch } from "@firebase/firestore"
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

export function subscribeToMySavedRecipeIds({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (recipeIds: string[]) => void
  onError: (error: Error) => void
}) {
  const savedRecipesRef = collection(db, "users", userId, "savedRecipes")

  return onSnapshot(
    savedRecipesRef,
    (snapshot) => {
      onChange(snapshot.docs.map((docSnap) => docSnap.id))
    },
    onError
  )
}

export function subscribeToMyFollowingUserIds({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (userIds: string[]) => void
  onError: (error: Error) => void
}) {
  const followingRef = collection(db, "users", userId, "following")

  return onSnapshot(
    followingRef,
    (snapshot) => {
      onChange(snapshot.docs.map((docSnap) => docSnap.id))
    },
    onError
  )
}

export async function toggleProfileFollow({
  currentUserId,
  targetUserId,
  isCurrentlyFollowing,
  currentUsername,
  currentProfileImage,
  targetUsername,
  targetProfileImage,
}: {
  currentUserId: string
  targetUserId: string
  isCurrentlyFollowing: boolean
  currentUsername: string
  currentProfileImage: string
  targetUsername: string
  targetProfileImage: string
}) {
  const currentFollowingRef = doc(db, "users", currentUserId, "following", targetUserId)
  const targetFollowerRef = doc(db, "users", targetUserId, "followers", currentUserId)

  const currentUserRef = doc(db, "users", currentUserId)
  const targetUserRef = doc(db, "users", targetUserId)

  const batch = writeBatch(db)

  if (isCurrentlyFollowing) {
    batch.delete(currentFollowingRef)
    batch.delete(targetFollowerRef)

    batch.update(currentUserRef, {
      "stats.followingCount": increment(-1),
    })

    batch.update(targetUserRef, {
      "stats.followersCount": increment(-1),
    })

    await batch.commit()
    return false
  }

  batch.set(currentFollowingRef, {
    userId: targetUserId,
    username: targetUsername,
    profileImageUrl: targetProfileImage,
    followedAt: serverTimestamp(),
  })

  batch.set(targetFollowerRef, {
    userId: currentUserId,
    username: currentUsername,
    profileImageUrl: currentProfileImage,
    followedAt: serverTimestamp(),
  })

  batch.update(currentUserRef, {
    "stats.followingCount": increment(1),
  })

  batch.update(targetUserRef, {
    "stats.followersCount": increment(1),
  })

  await batch.commit()
  return true
}