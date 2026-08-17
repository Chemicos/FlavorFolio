import { Timestamp } from "@firebase/firestore"

export const PRESENCE_HEARTBEAT_INTERVAL_MS = 60_000

export const ONLINE_THRESHOLD_MS = 2 * 60_000

export function getPresenceTimestampMs(
  lastSeenAt?: Timestamp | null
): number {
  if (!lastSeenAt || typeof lastSeenAt.toMillis !== "function") {
    return 0
  }

  return lastSeenAt.toMillis()
}

export function isUserOnline({
  lastSeenAt,
  now = Date.now(),
}: {
  lastSeenAt?: Timestamp | null
  now?: number
}): boolean {
  const lastSeenAtMs = getPresenceTimestampMs(lastSeenAt)

  if (!lastSeenAtMs) return false

  return now - lastSeenAtMs <= ONLINE_THRESHOLD_MS
}

export function formatLastSeen({
  lastSeenAt,
  now = Date.now(),
}: {
  lastSeenAt?: Timestamp | null
  now?: number
}): string {
  const lastSeenAtMs = getPresenceTimestampMs(lastSeenAt)

  if (!lastSeenAtMs) {
    return "Offline"
  }

  const differenceMs = Math.max(0, now - lastSeenAtMs)

  if (differenceMs <= ONLINE_THRESHOLD_MS) {
    return "Online"
  }

  const minutes = Math.floor(differenceMs / 60_000)

  if (minutes < 60) {
    return `Last seen ${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `Last seen ${hours}h ago`
  }

  return `Last seen ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastSeenAtMs))}`
}