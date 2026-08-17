import { AppTheme } from "../types/preferences.types"

export const APP_THEME_STORAGE_KEY = "flavorfolio-app-theme"

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)"

export function isAppTheme(
  value: unknown
): value is AppTheme {
  return (
    value === "dark" ||
    value === "light" ||
    value === "system"
  )
}

export function getStoredAppTheme(): AppTheme | null {
  const storedTheme = window.localStorage.getItem(
    APP_THEME_STORAGE_KEY
  )

  return isAppTheme(storedTheme)
    ? storedTheme
    : null
}

export function resolveAppTheme(
  theme: AppTheme
): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia(
      DARK_MEDIA_QUERY
    ).matches
      ? "dark"
      : "light"
  }

  return theme
}

export function applyAppTheme(
  theme: AppTheme
) {
  const resolvedTheme = resolveAppTheme(theme)

  const root = document.documentElement

  root.classList.toggle(
    "dark",
    resolvedTheme === "dark"
  )

  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme

  window.localStorage.setItem(
    APP_THEME_STORAGE_KEY,
    theme
  )
}

export function subscribeToSystemTheme(
  theme: AppTheme,
  onChange: () => void
) {
  if (theme !== "system") {
    return () => undefined
  }

  const mediaQuery =
    window.matchMedia(DARK_MEDIA_QUERY)

  const handleChange = () => {
    onChange()
  }

  mediaQuery.addEventListener(
    "change",
    handleChange
  )

  return () => {
    mediaQuery.removeEventListener(
      "change",
      handleChange
    )
  }
}