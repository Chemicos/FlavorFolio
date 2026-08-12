import { useParams } from "react-router-dom"
import { auth } from "../../../firebase-config"
import ChatLayout from "../components/ChatLayout"

export default function MessagesPage() {
  const { conversationId } = useParams()
  const currentUserId = auth.currentUser?.uid || null

  if (!currentUserId) return null

  return (
    <>
      <ChatLayout
        currentUserId={currentUserId}
        activeConversationId={conversationId || null}
      /> 
    </>
  )
}
