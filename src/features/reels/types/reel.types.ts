import { Timestamp } from "@firebase/firestore"

export interface ReelAuthor {
    userId: string
    username: string
    profileImage: string
}

export interface ReelStats {
    likesCount: number
    commentsCount: number
    sharesCount: number
    viewsCount: number
}

export interface Reel {
    reelId: string
    userId: string
    author: ReelAuthor
    description: string
    videoUrl: string
    videoFileName: string
    thumbnail?: string
    duration?: number
    visibility: "public" | "private"
    stats: ReelStats
    createdAt?: Timestamp
    updatedAt?: Timestamp
}