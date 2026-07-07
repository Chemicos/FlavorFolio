import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, WriteBatch, writeBatch } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export type NotificationType =
    | "recipe_saved"
    | "recipe_unsaved"
    | "comment"
    | "reply"
    | "follow"
    | "unfollow"
    | "user_followed"
    | "needs_revision"
    | "rating"
    | "comment_like"
    | "comment_dislike"
    | "reply_like"
    | "reply_dislike"
    | "recipe_approved"

export interface FlavorFolioNotification {
    id: string
    type: NotificationType
    actorUserId?: string
    actorUsername?: string
    actorProfileImage?: string
    recipeId?: string
    recipeTitle?: string
    message: string
    read: boolean
    createdAt?: {
        seconds: number
        nanoseconds: number
    }
}

export interface CreateFollowNotificationParams {
  recipientUserId: string
  actorUserId: string
  actorUsername: string
  actorProfileImage: string
}

export function getFollowNotificationId(actorUserId: string) {
  return `follow_${actorUserId}`
}

export function subscribeToUserNotifications({
  userId,
  limitCount = 20,
  onChange,
  onError,
}: {
  userId: string
  limitCount?: number
  onChange: (notifications: FlavorFolioNotification[]) => void
  onError: (error: Error) => void
}) {
  const notificationsQuery = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  )

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data()

          return {
            id: docSnap.id,
            type: data.type || "comment",
            actorUserId: data.actorUserId || "",
            actorUsername: data.actorUsername || "",
            actorProfileImage: data.actorProfileImage || "",
            recipeId: data.recipeId || "",
            recipeTitle: data.recipeTitle || "",
            message: data.message || "",
            read: Boolean(data.read),
            createdAt: data.createdAt || undefined,
          } as FlavorFolioNotification
        })
      )
    },
    onError
  )
}

export async function markNotificationAsRead({
  userId,
  notificationId,
}: {
  userId: string
  notificationId: string
}) {
  await updateDoc(doc(db, "users", userId, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp(),
  })
}

export async function markAllNotificationsAsRead({
  userId,
  notifications,
}: {
  userId: string
  notifications: FlavorFolioNotification[]
}) {
  const unreadNotifications = notifications.filter((notification) => !notification.read)

  if (unreadNotifications.length === 0) return

  const batch = writeBatch(db)

  unreadNotifications.forEach((notification) => {
    batch.update(doc(db, "users", userId, "notifications", notification.id), {
      read: true,
      readAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function deleteNotification({
  userId,
  notificationId,
}: {
  userId: string
  notificationId: string
}) {
  await deleteDoc(doc(db, "users", userId, "notifications", notificationId))
}

export function addFollowNotificationToBatch(
  batch: WriteBatch,
  {
    recipientUserId,
    actorUserId,
    actorUsername,
    actorProfileImage,
  }: CreateFollowNotificationParams
) {
  if (recipientUserId === actorUserId) return

  const notificationRef = doc(
    db,
    "users",
    recipientUserId,
    "notifications",
    getFollowNotificationId(actorUserId)
  )

  batch.set(notificationRef, {
    type: "user_followed",
    recipientUserId,
    actorUserId,
    actorUsername,
    actorProfileImage,
    title: "New follower",
    message: `${actorUsername || "Someone"} started following you.`,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export function deleteFollowNotificationFromBatch(
  batch: WriteBatch,
  {
    recipientUserId,
    actorUserId,
  }: {
    recipientUserId: string
    actorUserId: string
  }
) {
  const notificationRef = doc(
    db,
    "users",
    recipientUserId,
    "notifications",
    getFollowNotificationId(actorUserId)
  )

  batch.delete(notificationRef)
}