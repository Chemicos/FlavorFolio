import { AppTheme } from "../types/preferences.types"

export const APP_THEME_STORAGE_KEY = "flavorfolio-theme"

export function getResolvedTheme(
  theme: AppTheme
): "dark" | "light" {
  if (theme !== "system") {
    return theme
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light"
}

export function applyAppTheme(theme: AppTheme) {
  const resolvedTheme = getResolvedTheme(theme)
  const root = document.documentElement

  root.classList.toggle(
    "dark",
    resolvedTheme === "dark"
  )

  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme

  localStorage.setItem(
    APP_THEME_STORAGE_KEY,
    theme
  )
}