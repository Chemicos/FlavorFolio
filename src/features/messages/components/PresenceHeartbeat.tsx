import { usePresenceHeartbeat } from "../hooks/usePresenceHeartbeat"

interface PresenceHeartbeatProps {
  currentUserId?: string | null
}

export default function PresenceHeartbeat({
  currentUserId,
}: PresenceHeartbeatProps) {
  usePresenceHeartbeat(currentUserId)

  return null
}