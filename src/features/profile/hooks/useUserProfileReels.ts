import { useEffect, useState } from "react";
import { fetchUserPublicReels } from "../services/userProfile.service";
import { Reel } from "../../reels/types/reel.types";

export function useUserProfileReels(
    userId?: string | null,
    enabled = true
) {
    const [reels, setReels] = useState<Reel[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        if (!userId || !enabled) {
            setReels([])
            setIsLoading(false)
            setError(null)
            return
        }

        setReels([])
        setIsLoading(true)
        setError(null)

        fetchUserPublicReels(userId)
        .then((result) => {
            if (!cancelled) {
                setReels(result)
            }
        })
        .catch((err) => {
            if (!cancelled) {
                console.error("Failed to fetch user reels:", err)
                setError("Failed to load user reels.")
            }
        })
        .finally(() => {
            if (!cancelled) {
                setIsLoading(false)
            }
        })

        return () => {
            cancelled = true
        }
    }, [userId, enabled])

    return {reels, isLoading, error}
}