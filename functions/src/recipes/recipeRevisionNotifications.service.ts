import {FieldValue, getFirestore, type Transaction,} from "firebase-admin/firestore"

export interface RecipeResubmittedNotificationParams {
  recipientUserId: string
  actorUserId: string
  actorUsername: string
  actorProfileImage: string
  recipeId: string
  recipeTitle: string
}

export function addRecipeResubmittedNotificationToTransaction(
  transaction: Transaction,
  {
    recipientUserId,
    actorUserId,
    actorUsername,
    actorProfileImage,
    recipeId,
    recipeTitle,
  }: RecipeResubmittedNotificationParams
) {
  const notificationRef = getFirestore()
    .collection("users")
    .doc(recipientUserId)
    .collection("notifications")
    .doc(`recipe_resubmitted_${recipeId}`)

  transaction.set(
    notificationRef,
    {
      type: "recipe_resubmitted",
      recipientUserId,
      actorUserId,
      actorUsername,
      actorProfileImage,
      recipeId,
      recipeTitle,
      title: "Recipe resubmitted",
      message:
        "A creator revised and resubmitted this recipe for review.",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}