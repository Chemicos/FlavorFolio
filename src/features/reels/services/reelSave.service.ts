import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export interface ToggleReelSaveResult {
  isSaved: boolean
  savesCount: number
}

export async function toggleReelSave({
  reelId,
  userId,
}: {
  reelId: string
  userId: string
}): Promise<ToggleReelSaveResult> {
  if (!reelId) {
    throw new Error("Reel id is required.")
  }

  if (!userId) {
    throw new Error("You must be signed in to save a reel.")
  }

  const reelRef = doc(db, "reels", reelId)

  const savedReelRef = doc(db, "users", userId, "savedReels", reelId)

  return runTransaction(db, async (transaction) => {
    const [reelSnapshot, savedReelSnapshot] = await Promise.all([
      transaction.get(reelRef),
      transaction.get(savedReelRef),
    ])

    if (!reelSnapshot.exists()) {
      throw new Error("Reel does not exist.")
    }

    const reelData = reelSnapshot.data()

    const currentSavesCount = Number(
      reelData.savesCount ??
      reelData.stats?.savesCount ??
      0
    )

    if (savedReelSnapshot.exists()) {
      const nextSavesCount = Math.max(
        0,
        currentSavesCount - 1
      )

      transaction.delete(savedReelRef)

      transaction.set(
        reelRef,
        {
          savesCount: nextSavesCount,
          updatedAt: serverTimestamp(),
        },
        {merge: true}
      )

      return {
        isSaved: false,
        savesCount: nextSavesCount,
      }
    }

    const nextSavesCount = currentSavesCount + 1

    transaction.set(savedReelRef, {
      reelId,
      userId,
      savedAt: serverTimestamp(),
    })

    transaction.set(
      reelRef,
      {
        savesCount: nextSavesCount,
        updatedAt: serverTimestamp(),
      },
      {merge: true}
    )

    return {
      isSaved: true,
      savesCount: nextSavesCount,
    }
  })
}

export function subscribeToSavedReelIds({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (reelIds: string[]) => void
  onError: (error: Error) => void
}) {
  const savedReelsRef = collection(db,"users",userId,"savedReels")

  return onSnapshot(
    savedReelsRef,
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