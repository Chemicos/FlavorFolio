import { doc, serverTimestamp, setDoc } from "@firebase/firestore"
import { db } from "../../../firebase-config"

interface CreateNotificationInput {
  recipientUserId: string
  type: "recipe_saved" | "recipe_unsaved"
  actorUserId: string
  actorUsername: string
  actorProfileImage: string
  recipeId: string
  recipeTitle: string
  message: string
}

export async function createRecipeSaveNotification(input: CreateNotificationInput) {
  const notificationRef = doc(
    db,
    "users",
    input.recipientUserId,
    "notifications",
    crypto.randomUUID()
  )

  await setDoc(notificationRef, {
    type: input.type,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    actorProfileImage: input.actorProfileImage,
    recipeId: input.recipeId,
    recipeTitle: input.recipeTitle,
    message: input.message,
    read: false,
    createdAt: serverTimestamp(),
  })
}