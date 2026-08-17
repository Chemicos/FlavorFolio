import { doc, onSnapshot, serverTimestamp, updateDoc } from "@firebase/firestore"
import { AppLanguage, AppPreferences, AppTheme, defaultAppPreferences } from "../types/preferences.types"
import { db } from "../../../firebase-config"

function normalizeTheme(value: unknown): AppTheme {
  if (
    value === "dark" ||
    value === "light" ||
    value === "system"
  ) {
    return value
  }

  return defaultAppPreferences.theme
}

function normalizeLanguage(value: unknown): AppLanguage {
  if (value === "en" || value === "ro") {
    return value
  }

  return defaultAppPreferences.language
}

export function subscribeToAppPreferences({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (preferences: AppPreferences) => void
  onError: (error: Error) => void
}) {
  const userRef = doc(db, "users", userId)

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onError(new Error("User profile not found."))
        return
      }

      const data = snapshot.data()

      onChange({
        theme: normalizeTheme(
          data.preferences?.theme
        ),
        language: normalizeLanguage(
          data.preferences?.language
        ),
      })
    },
    onError
  )
}

export async function updateAppPreferences({
  userId,
  preferences,
}: {
  userId: string
  preferences: Partial<AppPreferences>
}) {
  if (!userId) {
    throw new Error("User id is required.")
  }

  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  if (preferences.theme) {
    updatePayload["preferences.theme"] =
      preferences.theme
  }

  if (preferences.language) {
    updatePayload["preferences.language"] =
      preferences.language
  }

  await updateDoc(
    doc(db, "users", userId),
    updatePayload
  )
}