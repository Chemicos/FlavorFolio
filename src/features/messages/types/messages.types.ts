import { Timestamp } from "@firebase/firestore"

export type ConversationType = "direct"
export type MessageType = "text" | "image" | "recipe"

export interface ConversationParticipant {
    userId: string
    username: string
    profileImage: string
}

export interface ConversationLastMessage {
    text: string
    senderId: string
    createdAt: Timestamp
    type?: MessageType
}

export interface Conversation {
    conversationId: string
    type: ConversationType
    participantIds: string[]
    participants: Record<string, ConversationParticipant>
    lastMessage: ConversationLastMessage | null
    unreadCount: Record<string, number>
    createdAt: Timestamp
    lastReadAt?: Record<string, any>
    updatedAt: Timestamp
}

export interface SharedRecipeMessage {
    recipeId: string
    title: string
    image: string
    authorUsername: string
    cuisine: string
    meal: string
    difficulty: string
    durationMinutes: number
}

export interface ChatMessage {
    messageId: string
    conversationId: string
    senderId: string
    receiverId: string
    text: string
    type: MessageType
    imageUrl?: string
    imagePath?: string
    recipe?:SharedRecipeMessage
    imageFileName?: string
    createdAt: Timestamp
    isDeleted: boolean
}


export type AllowMessagesFrom = "everyone" | "following" | "none" | ""