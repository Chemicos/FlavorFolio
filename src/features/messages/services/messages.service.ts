import { addDoc, collection, doc, getDoc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "@firebase/firestore"
import { db } from "../../../firebase-config"
import { ChatMessage, Conversation } from "../types/messages.types"

export function getDirectConversationId(currentUserId: string, targetUserId: string) {
  return [currentUserId, targetUserId].sort().join("_")
}

async function isBlockedBetweenUsers(currentUserId: string, targetUserId: string) {
    const [currentBlockedTarget, targetBlockedCurrent] = await Promise.all([
        getDoc(doc(db, "users", currentUserId, "blockedUsers", targetUserId)),
        getDoc(doc(db, "users", targetUserId, "blockedUsers", currentUserId)),
    ])

    return currentBlockedTarget.exists() || targetBlockedCurrent.exists()
}

async function areUsersMutualFollowers(currentUserId: string, targetUserId: string) {
    const [currentFollowsTarget, targetFollowsCurrent] = await Promise.all([
        getDoc(doc(db, "users", currentUserId, "following", targetUserId)),
        getDoc(doc(db, "users", targetUserId, "following", currentUserId)),
    ])

    return currentFollowsTarget.exists() && targetFollowsCurrent.exists()
}

async function canMessageUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) return false

    const isBlocked = await isBlockedBetweenUsers(currentUserId, targetUserId)
    if (isBlocked) return false

    const targetSnap = await getDoc(doc(db, "users", targetUserId))
    if (!targetSnap.exists()) return false

    const targetData = targetSnap.data()
    const allowMessagesFrom = targetData.allowMessagesFrom || "everyone"

    if (allowMessagesFrom === "none") return false

    const isMutualFollow = await areUsersMutualFollowers(
        currentUserId,
        targetUserId
    )

    if (!isMutualFollow) return false

    return true
}

export async function createOrOpenDirectConversation({
  currentUserId,
  targetUserId,
}: {
  currentUserId: string
  targetUserId: string
}) {
  const allowed = await canMessageUser(currentUserId, targetUserId)

  if (!allowed) {
    throw new Error("You cannot message this user.")
  }

  const conversationId = getDirectConversationId(currentUserId, targetUserId)
  const conversationRef = doc(db, "conversations", conversationId)
  const existingConversation = await getDoc(conversationRef)

  if (existingConversation.exists()) {
    return conversationId
  }

  const [currentUserSnap, targetUserSnap] = await Promise.all([
    getDoc(doc(db, "users", currentUserId)),
    getDoc(doc(db, "users", targetUserId)),
  ])

  if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
    throw new Error("User profile not found.")
  }

  const currentUser = currentUserSnap.data()
  const targetUser = targetUserSnap.data()

  await setDoc(conversationRef, {
    conversationId,
    type: "direct",
    participantIds: [currentUserId, targetUserId],
    participants: {
      [currentUserId]: {
        userId: currentUserId,
        username: currentUser.username || "Unknown",
        profileImage: currentUser.profileImage || "",
      },
      [targetUserId]: {
        userId: targetUserId,
        username: targetUser.username || "Unknown",
        profileImage: targetUser.profileImage || "",
      },
    },
    lastMessage: null,
    unreadCount: {
        [currentUserId]: 0,
        [targetUserId]: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

    return conversationId
}

export async function sendMessage({
    conversationId,
    senderId,
    receiverId,
    text,
}: {
    conversationId: string
    senderId: string
    receiverId: string
    text: string
}) {
    const cleanText = text.trim()

    if (!cleanText) return

    const conversationRef = doc(db, "conversations", conversationId)
    const conversationSnap = await getDoc(conversationRef)

    if (!conversationSnap.exists()) {
        throw new Error("Conversation not found.")
    }

    const messageRef = await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
            conversationId,
            senderId,
            receiverId,
            text: cleanText,
            type: "text",
            isDeleted: false,
            createdAt: serverTimestamp(),
        }
    )

    await updateDoc(conversationRef, {
        lastMessage: {
            text: cleanText,
            senderId,
            createdAt: serverTimestamp(),
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp(),
    })

    return messageRef.id
}

export function subscribeToConversations(
    currentUserId: string,
    callback: (conversations: Conversation[]) => void,
    onError?: (error: Error) => void
) {
    const conversationsQuery = query(
        collection(db, "conversations"),
        where("participantIds", "array-contains", currentUserId),
        orderBy("updatedAt", "desc")
    )

    return onSnapshot(
        conversationsQuery,
        (snapshot) => {
        const conversations = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as Conversation),
            conversationId: docSnap.id,
        }))

        callback(conversations)
        },
        onError
    )
}

export function subscribeToConversationMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void,
    onError?: (error: Error) => void
) {
    const messagesQuery = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc"),
        limit(80)
    )

    return onSnapshot(
        messagesQuery,
        (snapshot) => {
            const messages = snapshot.docs.map((docSnap) => ({
                ...(docSnap.data() as ChatMessage),
                messageId: docSnap.id,
            }))

            callback(messages)
        },
        onError
    )
}

export async function markConversationAsRead({
    conversationId,
    userId,
}: {
    conversationId: string
    userId: string
}) {
    const conversationRef = doc(db, "conversations", conversationId)

    await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0,
        [`lastReadAt.${userId}`]: serverTimestamp(),
    })
}