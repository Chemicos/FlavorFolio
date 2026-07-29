import { useEffect, useState } from "react"
import { AppTheme, defaultAppPreferences } from "../types/preferences.types"
import { applyAppTheme, getStoredAppTheme, subscribeToSystemTheme } from "../utils/appTheme"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { subscribeToAppPreferences } from "../services/preferences.service"


function getInitialTheme(): AppTheme {
  return (
    getStoredAppTheme() ??
    defaultAppPreferences.theme
  )
}

export default function AppThemeController() {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme)

  useEffect(() => {
    applyAppTheme(theme)

    return subscribeToSystemTheme(
      theme,
      () => applyAppTheme(theme)
    )
  }, [theme])

  useEffect(() => {
    const auth = getAuth()

    let unsubscribePreferences:
      | (() => void)
      | undefined

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          unsubscribePreferences?.()
          unsubscribePreferences =
            undefined

          if (!user) {
            setTheme(getInitialTheme())
            return
          }

          unsubscribePreferences =
            subscribeToAppPreferences({
              userId: user.uid,

              onChange: (
                preferences
              ) => {
                setTheme(
                  preferences.theme
                )
              },

              onError: (error) => {
                console.error(
                  "Failed to load global theme:",
                  error
                )

                setTheme(
                  getInitialTheme()
                )
              },
            })
        }
      )

    return () => {
      unsubscribeAuth()
      unsubscribePreferences?.()
    }
  }, [])

  return null
}
