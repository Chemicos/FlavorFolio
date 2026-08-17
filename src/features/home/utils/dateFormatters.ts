import { Timestamp } from "@firebase/firestore"

export function formatRelativeDate(value: unknown) {
  if (!value) return "now"

  const date =
    value instanceof Timestamp
      ? value.toDate()
      : value instanceof Date
        ? value
        : null

  if (!date) return "now"

  const now = Date.now()
  const diffMs = now - date.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day

  if (diffMs < minute) return "now"

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute)
    return `${minutes}m ago`
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour)
    return `${hours}h ago`
  }

  if (diffMs < month) {
    const days = Math.floor(diffMs / day)
    return `${days}d ago`
  }

  if (diffMs < year) {
    const months = Math.floor(diffMs / month)
    return `${months}mo ago`
  }

  if (diffMs >= year) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }) 
  }
}