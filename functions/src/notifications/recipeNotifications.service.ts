import { getFirestore, FieldValue, type Transaction, } from "firebase-admin/firestore"

export interface RecipePendingNotificationInput {
  recipientUserId: string
  actorUserId: string
  actorUsername: string
  actorProfileImage: string
  recipeId: string
  recipeTitle: string
}

export async function getAdminUserIds(): Promise<string[]> {
  const snapshot = await getFirestore()
    .collection("users")
    .where("admin", "==", true)
    .get()

  return snapshot.docs.map((doc) => doc.id)
}

export function addRecipePendingNotificationToTransaction(
  transaction: Transaction,
  {
    recipientUserId,
    actorUserId,
    actorUsername,
    actorProfileImage,
    recipeId,
    recipeTitle,
  }: RecipePendingNotificationInput
): void {
  const notificationRef = getFirestore()
    .collection("users")
    .doc(recipientUserId)
    .collection("notifications")
    .doc(`recipe_pending_${recipeId}`)

  transaction.set(notificationRef, {
    type: "recipe_pending",
    recipientUserId,
    actorUserId,
    actorUsername,
    actorProfileImage,
    recipeId,
    recipeTitle,
    title: "Recipe pending review",
    message: "A creator submitted a new recipe for review.",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}