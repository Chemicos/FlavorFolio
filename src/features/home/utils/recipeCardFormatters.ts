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