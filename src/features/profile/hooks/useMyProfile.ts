import { useEffect, useMemo, useState } from "react"
import { fetchMyProfile, MyProfileData, subscribeToMyProfile, updateMyProfile, UpdateMyProfilePayload, updateProfileAvatarImage, updateProfileBannerImage } from "../services/profile.service"
import { getAuth, onAuthStateChanged } from "firebase/auth"

function formatJoinedLabel(createdAt?: MyProfileData["createdAt"]) {
  if (!createdAt?.seconds) return "Joined recently"

  const date = new Date(createdAt.seconds * 1000)

  return `Joined ${new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date)}`
}

export function useMyProfile() {
    const [isAvatarUploading, setIsAvatarUploading] = useState(false)
    const [profile, setProfile] = useState<MyProfileData | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isBannerUploading, setIsBannerUploading] = useState(false)
    const [isProfileSaving, setIsProfileSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const auth = getAuth()
        let unsubscribeProfile: (() => void) | undefined

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        unsubscribeProfile?.()

        if (!user) {
            setProfile(null)
            setUserId(null)
            setIsLoading(false)
            return
        }

        setUserId(user.uid)
        setIsLoading(true)
        setError(null)

        unsubscribeProfile = subscribeToMyProfile(
            user.uid,
            (result) => {
            setProfile(result)
            setIsLoading(false)
            },
            (err) => {
            console.error("Failed to subscribe to my profile:", err)
            setError("Failed to load profile.")
            setIsLoading(false)
            }
        )
        })

        return () => {
        unsubscribeAuth()
        unsubscribeProfile?.()
        }
    }, [])

    const saveProfile = async (payload: UpdateMyProfilePayload) => {
        if (!userId) return

        setIsProfileSaving(true)

        try {
            await updateMyProfile({ userId, payload })
        } finally {
            setIsProfileSaving(false)
        }
    }

    const uploadAvatarImage = async (file: File) => {
        if (!userId) return

        setIsAvatarUploading(true)

        try {
            await updateProfileAvatarImage({userId,file,})
        } finally {
            setIsAvatarUploading(false)
        }
    }

    const uploadBannerImage = async (file: File) => {
        if (!userId) return

        setIsBannerUploading(true)

        try {
        await updateProfileBannerImage({
            userId,
            file,
        })
        } finally {
        setIsBannerUploading(false)
        }
    }

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
        userId,
        profile: displayProfile,
        isLoading,
        isBannerUploading,
        isAvatarUploading,
        error,
        uploadBannerImage,
        uploadAvatarImage,
        isProfileSaving,
        saveProfile,
    }
}