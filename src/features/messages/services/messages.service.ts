import { addDoc, collection, deleteDoc, doc, documentId, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "@firebase/firestore"
import { db, storage } from "../../../firebase-config"
import { ChatMessage, Conversation, ConversationParticipant, SharedRecipeMessage, SharedReelMessage } from "../types/messages.types"
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage"

const FIRESTORE_IN_QUERY_LIMIT = 30

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []

  for (
    let index = 0;
    index < items.length;
    index += chunkSize
  ) {
    chunks.push(
      items.slice(index, index + chunkSize)
    )
  }

  return chunks
}

export async function fetchConversationParticipants(
  userIds: string[]
): Promise<
  Record<string, ConversationParticipant>
> {
  const uniqueUserIds = [
    ...new Set(
      userIds
        .map((userId) => userId.trim())
        .filter(Boolean)
    ),
  ]

  if (!uniqueUserIds.length) {
    return {}
  }

  const userIdGroups = chunkArray(
    uniqueUserIds,
    FIRESTORE_IN_QUERY_LIMIT
  )

  const snapshots = await Promise.all(
    userIdGroups.map((userIdGroup) =>
      getDocs(
        query(
          collection(db, "users"),
          where(
            documentId(),
            "in",
            userIdGroup
          )
        )
      )
    )
  )

  const participants: Record<string,ConversationParticipant> = {}

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()

      participants[docSnap.id] = {
        userId: docSnap.id,
        username:
          data.username ||
          data.displayName ||
          "Unknown user",
        profileImage:
          data.profileImage || "",
      }
    })
  })

  return participants
}

export function getDirectConversationId(currentUserId: string, targetUserId: string) {
  return [currentUserId, targetUserId].sort().join("_")
}

async function isBlockedBetweenUsers(currentUserId: string, targetUserId: string) {
    const [currentBlockedTarget, currentBlockedByTarget] = await Promise.all([
        getDoc(doc(db, "users", currentUserId, "blockedUsers", targetUserId)),
        getDoc(doc(db, "users", currentUserId, "blockedBy", targetUserId)),
    ])

    return currentBlockedTarget.exists() || currentBlockedByTarget.exists()
}

export async function areUsersMutualFollowers(currentUserId: string, targetUserId: string) {
    const [currentFollowsTarget, targetFollowsCurrent] = await Promise.all([
        getDoc(doc(db, "users", currentUserId, "following", targetUserId)),
        getDoc(doc(db, "users", targetUserId, "following", currentUserId)),
    ])

    return currentFollowsTarget.exists() && targetFollowsCurrent.exists()
}

export async function canMessageUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) return false

    const isBlocked = await isBlockedBetweenUsers(currentUserId, targetUserId)
    if (isBlocked) return false

    const isMutualFollow = await areUsersMutualFollowers(currentUserId, targetUserId)
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

    const conversationRef = doc(
        db,
        "conversations",
        conversationId
    )

    const conversationSnap = await getDoc(
        conversationRef
    )

    if (!conversationSnap.exists()) {
        throw new Error("Conversation not found.")
    }

    const allowed = await canMessageUser(
        senderId,
        receiverId
    )

    if (!allowed) {
        throw new Error(
        "You can’t send messages unless you follow each other."
        )
    }

    const messageRef = doc(
        collection(
        db,
        "conversations",
        conversationId,
        "messages"
        )
    )

    const batch = writeBatch(db)

    batch.set(messageRef, {
        messageId: messageRef.id,
        conversationId,
        senderId,
        receiverId,
        text: cleanText,
        type: "text",
        isDeleted: false,
        createdAt: serverTimestamp(),
    })

    batch.update(conversationRef, {
        lastMessage: {
        text: cleanText,
        senderId,
        type: "text",
        createdAt: serverTimestamp(),
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp(),
    })

    await batch.commit()

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

export async function deleteMessage({
    conversationId,
    messageId,
    currentUserId,
}: {
    conversationId: string
    messageId: string
    currentUserId: string
}) {
    const messageRef = doc(
        db,
        "conversations",
        conversationId,
        "messages",
        messageId
    )

    const messageSnap = await getDoc(messageRef)

    if (!messageSnap.exists()) {
        throw new Error("Message not found.")
    }

    const messageData = messageSnap.data()

    if (messageData.senderId !== currentUserId) {
        throw new Error("You can only delete your own messages.")
    }

    if (messageData.type === "image" && messageData.imagePath) {
        try {
            await deleteObject(ref(storage, messageData.imagePath))
        } catch (error: any) {
            if (error?.code !== "storage/object-not-found") {
                console.error("Failed to delete message image:", error)
            }
        }
    }

    await deleteDoc(messageRef)

    const latestMessagesQuery = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "desc"),
        limit(1)
    )

    const latestMessagesSnap = await getDocs(latestMessagesQuery)
    const conversationRef = doc(db, "conversations", conversationId)

    if (latestMessagesSnap.empty) {
        await updateDoc(conversationRef, {
        lastMessage: null,
        updatedAt: serverTimestamp(),
        })

        return
    }

    const latestMessage = latestMessagesSnap.docs[0].data()

    await updateDoc(conversationRef, {
        lastMessage: {
            text:
                latestMessage.text ||
                (latestMessage.type === "image" ? "Sent an image" : ""),
            type: latestMessage.type || "text",
            senderId: latestMessage.senderId || "",
            createdAt: latestMessage.createdAt || serverTimestamp(),
        },
        updatedAt: latestMessage.createdAt || serverTimestamp(),
    })
}

function buildMessageImagePath({
    conversationId,
    senderId,
    file,
}: {
    conversationId: string
    senderId: string
    file: File
}) {
    const extension = file.name.split(".").pop() || "jpg"
    const fileName = `${Date.now()}_${crypto.randomUUID()}.${extension}`

    return {
        fileName,
        path: `conversation_images/${conversationId}/${senderId}/${fileName}`,
    }
}

function validateImageFile(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Only JPG, PNG or WEBP images are allowed.")
    }

    const maxSizeMb = 8
    const maxSizeBytes = maxSizeMb * 1024 * 1024

    if (file.size > maxSizeBytes) {
        throw new Error(`Image must be smaller than ${maxSizeMb}MB.`)
    }
}

export async function sendImageMessage({
    conversationId,
    senderId,
    receiverId,
    file,
    text = "",
}: {
    conversationId: string
    senderId: string
    receiverId: string
    file: File
    text?: string
}) {
    validateImageFile(file)

    const conversationRef = doc(
        db,
        "conversations",
        conversationId
    )

    const conversationSnap = await getDoc(
        conversationRef
    )

    if (!conversationSnap.exists()) {
        throw new Error("Conversation not found.")
    }

    const allowed = await canMessageUser(
        senderId,
        receiverId
    )

    if (!allowed) {
        throw new Error(
        "You can’t send messages unless you follow each other."
        )
    }

    const { fileName, path } = buildMessageImagePath({
        conversationId,
        senderId,
        file,
    })

    const storageRef = ref(storage, path)

    await uploadBytes(storageRef, file, {
        contentType: file.type,
    })

    const imageUrl = await getDownloadURL(storageRef)
    const cleanText = text.trim()

    const messageRef = doc(
        collection(
        db,
        "conversations",
        conversationId,
        "messages"
        )
    )

    const batch = writeBatch(db)

    batch.set(messageRef, {
        messageId: messageRef.id,
        conversationId,
        senderId,
        receiverId,
        text: cleanText,
        type: "image",
        imageUrl,
        imagePath: path,
        imageFileName: fileName,
        isDeleted: false,
        createdAt: serverTimestamp(),
    })

    batch.update(conversationRef, {
        lastMessage: {
        text: cleanText || "Sent an image",
        senderId,
        type: "image",
        createdAt: serverTimestamp(),
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp(),
    })

    try {
        await batch.commit()
    } catch (error) {
        try {
        await deleteObject(storageRef)
        } catch (cleanupError) {
        console.error(
            "Failed to clean up message image:",
            cleanupError
        )
        }

        throw error
    }

    return messageRef.id
}

export async function shareRecipeMessage({
    senderId,
    receiverId,
    recipe,
}: {
    senderId: string
    receiverId: string
    recipe: SharedRecipeMessage
}) {
    const allowed = await canMessageUser(
        senderId,
        receiverId
    )

    if (!allowed) {
        throw new Error(
        "You can’t share recipes unless you follow each other."
        )
    }

    const conversationId =
        await createOrOpenDirectConversation({
        currentUserId: senderId,
        targetUserId: receiverId,
        })

    const conversationRef = doc(
        db,
        "conversations",
        conversationId
    )

    const messageRef = doc(
        collection(
        db,
        "conversations",
        conversationId,
        "messages"
        )
    )

    const batch = writeBatch(db)

    batch.set(messageRef, {
        messageId: messageRef.id,
        conversationId,
        senderId,
        receiverId,
        text: "",
        type: "recipe",
        recipe,
        isDeleted: false,
        createdAt: serverTimestamp(),
    })

    batch.update(conversationRef, {
        lastMessage: {
        text: `Shared a recipe: ${recipe.title}`,
        senderId,
        type: "recipe",
        createdAt: serverTimestamp(),
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp(),
    })

    await batch.commit()

    return {
        conversationId,
        messageId: messageRef.id,
    }
}

export async function shareReelMessage({
  senderId,
  receiverId,
  reel,
}: {
  senderId: string
  receiverId: string
  reel: SharedReelMessage
}) {
  const allowed = await canMessageUser(senderId, receiverId)

  if (!allowed) {
    throw new Error(
      "You can’t share reels unless you follow each other."
    )
  }

  const conversationId =
    await createOrOpenDirectConversation({
      currentUserId: senderId,
      targetUserId: receiverId,
    })

  const conversationRef = doc(db, "conversations", conversationId)

  const reelRef = doc(db, "reels", reel.reelId)

  const reelSnapshot = await getDoc(reelRef)

  if (!reelSnapshot.exists()) {
    throw new Error("Reel does not exist.")
  }

  const messageRef = doc(
    collection(db, "conversations", conversationId, "messages")
  )

  const batch = writeBatch(db)

  batch.set(messageRef, {
    messageId: messageRef.id,
    conversationId,
    senderId,
    receiverId,
    text: "",
    type: "reel",
    reel,
    isDeleted: false,
    createdAt: serverTimestamp(),
  })

  batch.update(conversationRef, {
    lastMessage: {
      text: `Shared a reel: ${reel.title}`,
      senderId,
      type: "reel",
      createdAt: serverTimestamp(),
    },
    [`unreadCount.${receiverId}`]: increment(1),
    updatedAt: serverTimestamp(),
  })

  batch.update(reelRef, {
    sharesCount: increment(1),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  return {
    conversationId,
    messageId: messageRef.id,
  }
}