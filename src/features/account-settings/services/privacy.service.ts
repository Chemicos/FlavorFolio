import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export type ProfileVisibility = "public" | "followers"

export interface PrivacySettings {
  profileVisibility: ProfileVisibility
  showInSearch: boolean
}

export function subscribeToPrivacySettings({
  userId,
  onChange,
  onError,
}: {
  userId: string
  onChange: (settings: PrivacySettings) => void
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
        profileVisibility: data.privacy?.profileVisibility || "public",
        showInSearch: data.privacy?.showInSearch ?? true,
      })
    },
    onError
  )
}

export async function updatePrivacySettings({
  userId,
  settings,
}: {
  userId: string
  settings: Partial<PrivacySettings>
}) {
  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User profile not found.")
  }

  await updateDoc(userRef, {
    ...(settings.profileVisibility
      ? { "privacy.profileVisibility": settings.profileVisibility }
      : {}),
    ...(typeof settings.showInSearch === "boolean"
      ? { "privacy.showInSearch": settings.showInSearch }
      : {}),
    updatedAt: serverTimestamp(),
  })
}