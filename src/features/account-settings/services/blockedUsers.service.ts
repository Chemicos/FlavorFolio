import { collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, serverTimestamp, where, writeBatch } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export interface BlockedUser {
  uid: string
  username: string
  profileImage: string
  blockedAt?: {
    seconds: number
    nanoseconds: number
  }
}

export function subscribeToBlockedUserIds({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (ids: string[]) => void
  onError: (error: Error) => void
}) {
  return onSnapshot(
    collection(db, "users", userId, "blockedUsers"),
    (snapshot) => onChange(snapshot.docs.map((docSnap) => docSnap.id)),
    onError
  )
}

export function subscribeToBlockedByUserIds({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (ids: string[]) => void
  onError: (error: Error) => void
}) {
  return onSnapshot(
    collection(db, "users", userId, "blockedBy"),
    (snapshot) => onChange(snapshot.docs.map((docSnap) => docSnap.id)),
    onError
  )
}

export async function blockUser({
  currentUserId,
  targetUserId,
  targetUsername,
  targetProfileImage,
}: {
  currentUserId: string
  targetUserId: string
  targetUsername: string
  targetProfileImage: string
}) {
  if (currentUserId === targetUserId) return

  const batch = writeBatch(db)

  const currentBlockedRef = doc(db, "users", currentUserId, "blockedUsers", targetUserId)
  const targetBlockedByRef = doc(db, "users", targetUserId, "blockedBy", currentUserId)

  const currentFollowingTargetRef = doc(db, "users", currentUserId, "following", targetUserId)
  const targetFollowerCurrentRef = doc(db, "users", targetUserId, "followers", currentUserId)

  const targetFollowingCurrentRef = doc(db, "users", targetUserId, "following", currentUserId)
  const currentFollowerTargetRef = doc(db, "users", currentUserId, "followers", targetUserId)

  const targetUserRef = doc(db, "users", targetUserId)

  const [
    currentFollowsTargetSnap,
    targetFollowsCurrentSnap,
    targetUserSnap,
  ] = await Promise.all([
    getDoc(currentFollowingTargetRef),
    getDoc(targetFollowingCurrentRef),
    getDoc(targetUserRef)
  ])

  const targetUserData = targetUserSnap.exists() ? targetUserSnap.data() : null
  const canonicalUsername = targetUserData?.username || targetUsername || "User"
  const canonicalProfileImage = targetUserData?.profileImage || targetUserData?.profileImageUrl || targetProfileImage || ""

  // const targetRecipesSnapshot = await getDocs(
  //   query(
  //     collection(db, "recipes"),
  //     where("userId", "==", targetUserId),
  //     where("status", "==", "published"),
  //     where("visibility", "==", "public")
  //   )
  // )

  const savedRecipesSnapshot = await getDocs(
    query(
      collection(db, "users", currentUserId, "savedRecipes"),
      where("recipeOwnerId", "==", targetUserId)
    )
  )

  savedRecipesSnapshot.docs.forEach((savedDoc) => {
    batch.delete(savedDoc.ref)
  })

  if (savedRecipesSnapshot.size > 0) {
    batch.update(doc(db, "users", currentUserId), {
      "stats.savedRecipesCount": increment(-savedRecipesSnapshot.size),
    })
  }

  // targetRecipesSnapshot.docs.forEach((recipeDoc) => {
  //   batch.delete(
  //     doc(db, "users", currentUserId, "savedRecipes", recipeDoc.id)
  //   )
  // })

  // if (targetRecipesSnapshot.size > 0) {
  //   batch.update(doc(db, "users", currentUserId), {
  //     "stats.savedRecipesCount": increment(-targetRecipesSnapshot.size),
  //   })
  // }

  batch.set(currentBlockedRef, {
    userId: targetUserId,
    username: canonicalUsername,
    profileImageUrl: canonicalProfileImage,
    blockedAt: serverTimestamp(),
  })

  batch.set(targetBlockedByRef, {
    userId: currentUserId,
    blockedAt: serverTimestamp(),
  })

  batch.delete(currentFollowingTargetRef)
  batch.delete(targetFollowerCurrentRef)
  batch.delete(targetFollowingCurrentRef)
  batch.delete(currentFollowerTargetRef)

  if (currentFollowsTargetSnap.exists()) {
    batch.update(doc(db, "users", currentUserId), {
      "stats.followingCount": increment(-1),
    })

    batch.update(doc(db, "users", targetUserId), {
      "stats.followersCount": increment(-1),
    })
  }

  if (targetFollowsCurrentSnap.exists()) {
    batch.update(doc(db, "users", targetUserId), {
      "stats.followingCount": increment(-1),
    })

    batch.update(doc(db, "users", currentUserId), {
      "stats.followersCount": increment(-1),
    })
  }

  batch.update(doc(db, "users", currentUserId), {
    "stats.blockedCount": increment(1),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function unblockUser({
  currentUserId,
  targetUserId,
}: {
  currentUserId: string
  targetUserId: string
}) {
  const batch = writeBatch(db)

  batch.delete(doc(db, "users", currentUserId, "blockedUsers", targetUserId))
  batch.delete(doc(db, "users", targetUserId, "blockedBy", currentUserId))

  batch.update(doc(db, "users", currentUserId), {
    "stats.blockedCount": increment(-1),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export function subscribeToBlockedUsers({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (users: BlockedUser[]) => void
  onError: (error: Error) => void
}) {
  return onSnapshot(
    collection(db, "users", userId, "blockedUsers"),
    (snapshot) => {
      onChange(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data()

          return {
            uid: docSnap.id,
            username: data.username || "User",
            profileImage: data.profileImageUrl || data.profileImage || "",
            blockedAt: data.blockedAt || undefined,
          }
        })
      )
    },
    onError
  )
}