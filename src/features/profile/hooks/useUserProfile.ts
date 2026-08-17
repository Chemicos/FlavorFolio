import { useEffect, useMemo, useState } from "react"
import { MyProfileData } from "../services/profile.service"
import { subscribeToUserProfile, fetchUserPublicRecipes } from "../services/userProfile.service"

function formatJoinedLabel(
  createdAt?: MyProfileData["createdAt"]
) {
  if (!createdAt?.seconds) return "Joined recently"

  return `Joined ${new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt.seconds * 1000))}`
}

export function useUserProfile(
  userId?: string | null
) {
  const [profile, setProfile] = useState<MyProfileData | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeToUserProfile(
      userId,
      (profileResult) => {
        setProfile(profileResult)
        setIsLoading(false)
      },
      (error) => {
        console.error(
          "Failed to subscribe to user profile:",
          error
        )

        setProfile(null)
        setError("Failed to load user profile.")
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const displayProfile = useMemo(() => {
    if (!profile) return null

    const fullName = [
      profile.firstName,
      profile.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim()

    return {
      ...profile,
      fullName:
        fullName || profile.username,
      joinedLabel: formatJoinedLabel(
        profile.createdAt
      ),
    }
  }, [profile])

  return {
    profile: displayProfile,
    isLoading,
    error,
  }
}