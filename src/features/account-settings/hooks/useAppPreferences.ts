import { useEffect, useState } from "react"
import { subscribeToAppPreferences, updateAppPreferences } from "../services/preferences.service"
import { AppLanguage, AppPreferences, AppTheme, defaultAppPreferences } from "../types/preferences.types"
import { APP_THEME_STORAGE_KEY, applyAppTheme, subscribeToSystemTheme } from "../utils/appTheme"
import { getAuth, onAuthStateChanged } from "firebase/auth"

function getInitialTheme(): AppTheme {
  const storedTheme = localStorage.getItem(APP_THEME_STORAGE_KEY)

  if (
    storedTheme === "dark" ||
    storedTheme === "light" ||
    storedTheme === "system"
  ) {
    return storedTheme
  }

  return defaultAppPreferences.theme
}

export function useAppPreferences() {
  const [userId, setUserId] = useState<string | null>(null)

  const [preferences, setPreferences] =
    useState<AppPreferences>(() => ({
      ...defaultAppPreferences,
      theme: getInitialTheme(),
    }))

  const [isLoading, setIsLoading] = useState(true)

  const [savingKey, setSavingKey] = useState<keyof AppPreferences | null>(null)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    applyAppTheme( preferences.theme )

    return subscribeToSystemTheme(
      preferences.theme,
      () => {
        applyAppTheme(
          preferences.theme
        )
      }
    )
  }, [preferences.theme])

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)

      if (!user) {
        setIsLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    const unsubscribe =
      subscribeToAppPreferences({
        userId,
        onChange: (nextPreferences) => {
          setPreferences(nextPreferences)
          setIsLoading(false)
        },
        onError: (error) => {
          console.error(
            "Failed to load app preferences:",
            error
          )

          setError(
            "Failed to load app preferences."
          )

          setIsLoading(false)
        },
      })

    return () => unsubscribe()
  }, [userId])

  const updateTheme = async (
    theme: AppTheme
  ) => {
    if (!userId || savingKey) return

    const previousTheme = preferences.theme

    setPreferences((previous) => ({
      ...previous,
      theme,
    }))

    applyAppTheme(theme)

    window.localStorage.setItem( APP_THEME_STORAGE_KEY, theme )

    try {
      setSavingKey("theme")

      await updateAppPreferences({
        userId,
        preferences: {
          theme,
        },
      })
    } catch (error) {
      setPreferences((previous) => ({
        ...previous,
        theme: previousTheme,
      }))

      applyAppTheme(previousTheme)

      window.localStorage.setItem( APP_THEME_STORAGE_KEY, previousTheme )

      throw error
    } finally {
      setSavingKey(null)
    }
  }

  const updateLanguage = async (
    language: AppLanguage
  ) => {
    if (!userId || savingKey) return

    const previousLanguage = preferences.language

    setPreferences((previous) => ({
      ...previous,
      language,
    }))

    try {
      setSavingKey("language")

      await updateAppPreferences({userId, preferences: { language },})
    } catch (error) {
      setPreferences((previous) => ({
        ...previous,
        language: previousLanguage,
      }))

      throw error
    } finally {
      setSavingKey(null)
    }
  }

  return {
    preferences,
    isLoading,
    savingKey,
    error,
    updateTheme,
    updateLanguage,
  }
}