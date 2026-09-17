import { useEffect, useState } from "react";
import { Reel } from "../../reels/types/reel.types";
import { fetchReelsByIds, fetchUserReels } from "../../reels/services/reels.service";

export function useMyProfileReels(userId?: string | null, savedReelIds: string[] = []) {
    const [reels, setReels] = useState<Reel[]>([])
    const [savedReels, setSavedReels] = useState<Reel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSavedReelsLoading, setIsSavedReelsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) {
            setReels([])
            setIsLoading(false)
            return
        }

        let cancelled = false

        async function loadReels() {
            try {
                setIsLoading(true)
                setError(null)

                const data = await fetchUserReels(userId)

                if (!cancelled) {
                    setReels(data)
                }
            } catch (error) {
                console.error("Failed to load profile reels:", error)

                if (!cancelled) {
                    setError("Failed to load reels.")
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        loadReels()

        return () => {
            cancelled = true
        }
    }, [userId])

    useEffect(() => {
        if (!userId || !savedReelIds.length) {
            setSavedReels([])
            setIsSavedReelsLoading(false)
            return
        }

        let cancelled = false

        async function loadSavedReels() {
            try {
                setIsSavedReelsLoading(true)

                const data = await fetchReelsByIds(savedReelIds)

                if (!cancelled) {
                    setSavedReels(data.filter((reel) => reel.status === "published"))
                }
            } catch (error) {
                console.error("Failed to load saved reels:", error)
            } finally {
                if (!cancelled) {
                    setIsSavedReelsLoading(false)
                }
            }
        }

        loadSavedReels()

        return () => {
            cancelled = true
        }
    }, [userId, savedReelIds])

    return {
        reels,
        savedReels,
        setReels,
        setSavedReels,
        isLoading,
        isSavedReelsLoading,
        error,
    }
}