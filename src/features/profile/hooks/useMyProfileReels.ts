import { useEffect, useState } from "react";
import { Reel } from "../../reels/types/reel.types";
import { fetchUserReels } from "../../reels/services/reels.service";

export function useMyProfileReels(userId?: string | null) {
    const [reels, setReels] = useState<Reel[]>([])
    const [isLoading, setIsLoading] = useState(true)
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

    return {
        reels,
        setReels,
        isLoading,
        error,
    }
}