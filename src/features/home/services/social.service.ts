import {
  doc,
  runTransaction,
  serverTimestamp,
} from "@firebase/firestore"
import { db } from "../../../firebase-config"


interface ToggleFollowInput {
  currentUserId: string
  authorId: string
  authorUsername: string
  authorProfileImage: string
  currentUsername: string
  currentProfileImage: string
}

function getFollowNotificationId(actorUserId: string) {
  return `follow_${actorUserId}`
}

export async function toggleFollowUser(input: ToggleFollowInput) {
  const currentUserRef = doc(db, "users", input.currentUserId)
  const authorUserRef = doc(db, "users", input.authorId)

  const followingRef = doc(db, "users", input.currentUserId, "following", input.authorId)
  const followerRef = doc(db, "users", input.authorId, "followers", input.currentUserId)

  const followNotificationRef = doc(
    db,
    "users",
    input.authorId,
    "notifications",
    getFollowNotificationId(input.currentUserId)
  )

  return runTransaction(db, async (transaction) => {
    const followingSnap = await transaction.get(followingRef)
    const authorSnap = await transaction.get(authorUserRef)
    const currentUserSnap = await transaction.get(currentUserRef)

    if (!authorSnap.exists() || !currentUserSnap.exists()) {
      throw new Error("User documents missing.")
    }

    const authorData = authorSnap.data()
    const currentData = currentUserSnap.data()

    const currentFollowersCount = Number(authorData?.stats?.followersCount || 0)
    const currentFollowingCount = Number(currentData?.stats?.followingCount || 0)

    if (followingSnap.exists()) {
      transaction.delete(followingRef)
      transaction.delete(followerRef)
      transaction.delete(followNotificationRef)

      transaction.set(authorUserRef, {
        stats: {
          ...authorData?.stats,
          followersCount: Math.max(0, currentFollowersCount - 1),
        },
      }, { merge: true })

      transaction.set(currentUserRef, {
        stats: {
          ...currentData?.stats,
          followingCount: Math.max(0, currentFollowingCount - 1),
        },
      }, { merge: true })

      return false
    }

    transaction.set(followingRef, {
      userId: input.authorId,
      username: input.authorUsername,
      profileImageUrl: input.authorProfileImage,
      followedAt: serverTimestamp(),
    })

    transaction.set(followerRef, {
      userId: input.currentUserId,
      username: input.currentUsername,
      profileImageUrl: input.currentProfileImage,
      followedAt: serverTimestamp(),
    })

    transaction.set(followNotificationRef, {
      type: "user_followed",
      recipientUserId: input.authorId,
      actorUserId: input.currentUserId,
      actorUsername: input.currentUsername || "User",
      actorProfileImage: input.currentProfileImage || "",
      title: "New follower",
      message: `${input.currentUsername || "Someone"} started following you.`,
      isRead: false,
      createdAt: serverTimestamp(),
    })

    transaction.set(authorUserRef, {
      stats: {
        ...authorData?.stats,
        followersCount: currentFollowersCount + 1,
      },
    }, { merge: true })

    transaction.set(currentUserRef, {
      stats: {
        ...currentData?.stats,
        followingCount: currentFollowingCount + 1,
      },
    }, { merge: true })

    return true
  })
}