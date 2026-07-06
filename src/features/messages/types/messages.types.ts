import { Timestamp } from "@firebase/firestore"

export type ConversationType = "direct"
export type MessageType = "text"

export interface ConversationParticipant {
    userId: string
    username: string
    profileImage: string
}

export interface ConversationLastMessage {
    text: string
    senderId: string
    createdAt: Timestamp
}

export interface Conversation {
    conversationId: string
    type: ConversationType
    participantIds: string[]
    participants: Record<string, ConversationParticipant>
    lastMessage: ConversationLastMessage | null
    unreadCount: Record<string, number>
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface ChatMessage {
    messageId: string
    conversationId: string
    senderId: string
    receiverId: string
    text: string
    type: MessageType
    createdAt: Timestamp
    isDeleted: boolean
}

export type AllowMessagesFrom = "everyone" | "following" | "none" | ""