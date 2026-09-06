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

export interface ReelTimestamp {
  seconds?: number
  nanoseconds?: number
}

export type ReelVisibility = "public" | "private"
export type ReelStatus = "published" | "pending" | "needs_revision" | "draft"
export type ReelMealType = "breakfast" | "lunch" | "dinner" | "dessert" | "snack"

export interface Reel {
    reelId: string
    userId: string
    author: ReelAuthor
    title: string
    status: ReelStatus
    description: string
    meal: ReelMealType
    videoUrl: string
    videoFileName: string
    thumbnail?: string
    duration?: number
    visibility: ReelVisibility
    stats: ReelStats
    submittedAt?: any
    publishedAt?: any
    revisionReason?: string
    createdAt?: Timestamp
    updatedAt?: Timestamp
}

export interface updateReelDraftInput {
  reelId: string
  userId: string
  title: string
  description: string
  meal: ReelMealType
  visibility: Reel["visibility"]
}

export interface CreateReelInput {
  userId: string
  username: string
  userProfileImage?: string
  title: string
  description: string
  meal: ReelMealType
  visibility: ReelVisibility
  videoFile: File
  durationSeconds: number
}

export interface CreateReelResult {
  reelId: string
  videoUrl: string
}