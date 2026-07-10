import { collection, getDocs, limit, orderBy, query, where } from "@firebase/firestore"
import { Reel } from "../types/reel.types"
import { db } from "../../../firebase-config"

function mapReelDoc(docSnap: any): Reel {
  const data = docSnap.data()

  return {
    reelId: data.reelId || docSnap.id,
    userId: data.userId || data.author?.userId || "",

    author: {
      userId: data.author?.userId || data.userId || "",
      username: data.author?.username || data.username || "Unknown",
      profileImage:
        data.author?.profileImage || data.userProfileImage || "",
    },

    description: data.description || data.title || "",
    videoUrl: data.videoUrl || "",
    videoFileName: data.videoFileName || "",

    thumbnail: data.thumbnail || data.thumbnailUrl || "",
    duration: Number(data.duration || data.durationSeconds || 0),

    visibility: data.visibility || "public",

    stats: {
      likesCount: Number(data.stats?.likesCount ?? data.likesCount ?? 0),
      commentsCount: Number(data.stats?.commentsCount ?? data.commentsCount ?? 0),
      sharesCount: Number(data.stats?.sharesCount ?? data.sharesCount ?? 0),
      viewsCount: Number(data.stats?.viewsCount ?? data.viewsCount ?? 0),
    },

    createdAt: data.createdAt || undefined,
    updatedAt: data.updatedAt || undefined,
  }
}

export async function fetchPublicReels(limitCount = 20): Promise<Reel[]> {
    const reelsQuery = query(
        collection(db, "reels"),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    )

    const snapshot = await getDocs(reelsQuery)

    return snapshot.docs
        .map(mapReelDoc)
        .filter((reel) => Boolean(reel.videoUrl))
}