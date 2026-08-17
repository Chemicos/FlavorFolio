import { Timestamp } from "@firebase/firestore"

export interface ReelCommentAuthor {
  userId: string
  username: string
  profileImage: string
}

export interface ReelComment {
  id: string
  reelId: string
  userId: string
  username: string
  profileImage: string
  text: string
  edited: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface CreateReelCommentInput {
  reelId: string
  userId: string
  username: string
  profileImage?: string
  text: string
}

export interface DeleteReelCommentInput {
  reelId: string
  commentId: string
  currentUserId: string
}

export interface UpdateReelCommentInput {
  reelId: string
  commentId: string
  currentUserId: string
  text: string
}