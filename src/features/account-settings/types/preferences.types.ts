export type AppTheme = "dark" | "light" | "system"
export type AppLanguage = "en" | "ro"

export interface AppPreferences {
  theme: AppTheme
  language: AppLanguage
}

export const defaultAppPreferences: AppPreferences = {
  theme: "dark",
  language: "en",
}