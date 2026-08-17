export function formatCompactCount(value?: number | null, withParens = false) {
  const safeValue = Number(value || 0)

  let result = "0"

  if (safeValue < 1000) {
    result = `${safeValue}`
  } else {
    result = `${(safeValue / 1000).toFixed(1)}k`
  }

  return withParens ? `(${result})` : result
}

export function formatFollowersLabel(value?: number | null) {
  const safeValue = Number(value || 0)

  if (safeValue < 1000) return `${safeValue} followers`
  return `${(safeValue / 1000).toFixed(1)}k followers`
}

export function truncateText(text?: string, max = 25) {
  const safeText = text || ""
  if (safeText.length <= max) return safeText
  return `${safeText.slice(0, max)}...`
}

export function formatDurationMinutes(value?: number | null) {
  const minutes = Number(value || 0)

  if (!minutes) return "info"
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!remainingMinutes) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}