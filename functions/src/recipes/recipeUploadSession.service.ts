import {
  getFirestore,
  type Transaction,
} from "firebase-admin/firestore"

export type RecipeUploadSessionStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "cleaning"
  | "cleaned"

export interface RecipeUploadSession {
  userId: string
  requestId: string
  day: string
  uploadPrefix: string
  status: RecipeUploadSessionStatus
  createdAt: number
  expiresAt: number
  completedAt: number | null
  cancelledAt: number | null
}

export function getRecipeUploadSessionRef(
  requestId: string
) {
  return getFirestore()
    .collection("recipeUploadSessions")
    .doc(requestId)
}

export function createRecipeUploadSession(
  transaction: Transaction,
  {
    userId,
    requestId,
    day,
    expiresAt,
  }: {
    userId: string
    requestId: string
    day: string
    expiresAt: number
  }
) {
  const sessionRef = getRecipeUploadSessionRef(requestId)

  const session: RecipeUploadSession = {
    userId,
    requestId,
    day,
    uploadPrefix: `recipe_uploads/${userId}/${requestId}/`,
    status: "active",
    createdAt: Date.now(),
    expiresAt,
    completedAt: null,
    cancelledAt: null,
  }

  transaction.create(sessionRef, session)
}

export function completeRecipeUploadSession(
  transaction: Transaction,
  requestId: string
) {
  transaction.update(
    getRecipeUploadSessionRef(requestId),
    {
      status: "completed",
      completedAt: Date.now(),
    }
  )
}

export function cancelRecipeUploadSession(
  transaction: Transaction,
  requestId: string
) {
  transaction.update(
    getRecipeUploadSessionRef(requestId),
    {
      status: "cancelled",
      cancelledAt: Date.now(),
    }
  )
}