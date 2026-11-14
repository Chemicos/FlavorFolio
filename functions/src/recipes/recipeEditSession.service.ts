import { getFirestore, type Transaction } from "firebase-admin/firestore"

export type RecipeEditSessionStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "cleaning"
  | "cleaned"

export interface RecipeEditSession {
  userId: string
  recipeId: string
  requestId: string
  day: string
  action: "editRecipe"
  uploadPrefix: string
  status: RecipeEditSessionStatus
  createdAt: number
  expiresAt: number
  completedAt: number | null
  cancelledAt: number | null
  recipeVersion: number
}

export function getRecipeEditSessionRef(
  requestId: string
) {
  return getFirestore()
    .collection("recipeEditSessions")
    .doc(requestId)
}

export function createRecipeEditSession(
  transaction: Transaction,
  {
    userId,
    recipeId,
    requestId,
    day,
    expiresAt,
    recipeVersion,
  }: {
    userId: string
    recipeId: string
    requestId: string
    day: string
    expiresAt: number
    recipeVersion: number
  }
) {
  const session: RecipeEditSession = {
    userId,
    recipeId,
    requestId,
    day,
    action: "editRecipe",
    uploadPrefix: `recipe_edit_uploads/${userId}/${requestId}/`,
    status: "active",
    recipeVersion,
    createdAt: Date.now(),
    expiresAt,
    completedAt: null,
    cancelledAt: null,
  }

  transaction.create(
    getRecipeEditSessionRef(requestId),
    session
  )
}

export function completeRecipeEditSession(
  transaction: Transaction,
  requestId: string
) {
  transaction.update(
    getRecipeEditSessionRef(requestId),
    {
      status: "completed",
      completedAt: Date.now(),
    }
  )
}

export function cancelRecipeEditSession(
  transaction: Transaction,
  requestId: string
) {
  transaction.update(
    getRecipeEditSessionRef(requestId),
    {
      status: "cancelled",
      cancelledAt: Date.now(),
    }
  )
}