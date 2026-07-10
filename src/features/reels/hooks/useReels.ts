import { useEffect, useState } from "react"
import { Reel } from "../types/reel.types"
import { fetchPublicReels } from "../services/reels.service"

export function useReels(limitCount = 20) {
    const [reels, setReels] = useState<Reel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function loadReels() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await fetchPublicReels(limitCount)

            if (isMounted) {
            setReels(data)
            }
        } catch (error) {
            console.error("Failed to fetch reels:", error)

            if (isMounted) {
            setError("Failed to load reels.")
            }
        } finally {
            if (isMounted) {
            setIsLoading(false)
            }
        }
        }

        loadReels()

        return () => {
        isMounted = false
        }
    }, [limitCount])

    return {
        reels,
        isLoading,
        error,
    }
}