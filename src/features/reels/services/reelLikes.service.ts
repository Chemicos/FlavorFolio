import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export interface ToggleReelLikeResult {
  isLiked: boolean
  likesCount: number
}

export async function toggleReelLike({
  reelId,
  userId,
}: {
  reelId: string
  userId: string
}): Promise<ToggleReelLikeResult> {
  if (!reelId) {
    throw new Error("Reel id is required.")
  }

  if (!userId) {
    throw new Error("You must be signed in to like a reel.")
  }

  const reelRef = doc(db, "reels", reelId)

  const likedReelRef = doc(
    db,
    "users",
    userId,
    "likedReels",
    reelId
  )

  return runTransaction(db, async (transaction) => {
    const [reelSnapshot, likedReelSnapshot] =
      await Promise.all([
        transaction.get(reelRef),
        transaction.get(likedReelRef),
      ])

    if (!reelSnapshot.exists()) {
      throw new Error("Reel does not exist.")
    }

    const reelData = reelSnapshot.data()

    const currentLikesCount = Number(
      reelData.likesCount ??
        reelData.stats?.likesCount ??
        0
    )

    if (likedReelSnapshot.exists()) {
      const nextLikesCount = Math.max(
        0,
        currentLikesCount - 1
      )

      transaction.delete(likedReelRef)

      transaction.set(
        reelRef,
        {
          likesCount: nextLikesCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      return {
        isLiked: false,
        likesCount: nextLikesCount,
      }
    }

    const nextLikesCount = currentLikesCount + 1

    transaction.set(likedReelRef, {
      reelId,
      userId,
      likedAt: serverTimestamp(),
    })

    transaction.set(
      reelRef,
      {
        likesCount: nextLikesCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return {
      isLiked: true,
      likesCount: nextLikesCount,
    }
  })
}

export function subscribeToLikedReelIds({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (reelIds: string[]) => void
  onError: (error: Error) => void
}) {
  const likedReelsRef = collection(db, "users", userId, "likedReels")

  return onSnapshot(
    likedReelsRef,
    (snapshot) => {
      onChange(
        snapshot.docs.map((documentSnapshot) => {
          const data = documentSnapshot.data()

          return String(
            data.reelId || documentSnapshot.id
          )
        })
      )
    },
    onError
  )
}