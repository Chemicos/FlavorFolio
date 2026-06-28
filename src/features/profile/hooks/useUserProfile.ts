import { useEffect, useMemo, useState } from "react"
import { MyProfileData } from "../services/profile.service"
import { ProfileRecipeGridItem } from "../components/ProfileRecipeGrid"
import { subscribeToUserProfile, fetchUserPublicRecipes } from "../services/userProfile.service"

function formatJoinedLabel(createdAt?: MyProfileData["createdAt"]) {
  if (!createdAt?.seconds) return "Joined recently"

  return `Joined ${new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt.seconds * 1000))}`
}

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<MyProfileData | null>(null)
  const [recipes, setRecipes] = useState<ProfileRecipeGridItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    setIsLoading(true)
    setError(null)

    const unsubscribeProfile = subscribeToUserProfile(
      userId,
      (profileResult) => {
        if (!isMounted) return
        setProfile(profileResult)
        setIsLoading(false)
      },
      (error) => {
        console.error("Failed to subscribe to user profile:", error)

        if (!isMounted) return
        setError("Failed to load user profile.")
        setIsLoading(false)
      }
    )

    fetchUserPublicRecipes(userId)
      .then((recipesResult) => {
        if (!isMounted) return
        setRecipes(recipesResult)
      })
      .catch((error) => {
        console.error("Failed to load user recipes:", error)

        if (!isMounted) return
        setError("Failed to load user recipes.")
      })

    return () => {
      isMounted = false
      unsubscribeProfile()
    }
  }, [userId])

  const displayProfile = useMemo(() => {
    if (!profile) return null

    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()

    return {
      ...profile,
      fullName: fullName || profile.username,
      joinedLabel: formatJoinedLabel(profile.createdAt),
    }
  }, [profile])

  return {
    profile: displayProfile,
    recipes,
    setRecipes,
    isLoading,
    error,
  }
}