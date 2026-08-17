import { useCallback, useEffect, useState } from "react"
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

            const data = await fetchPublicReels(
                limitCount
            )

            if (isMounted) {
                setReels(data)
            }
        } catch (error) {
            console.error("Failed to fetch reels:", error)

            if (isMounted) {setError("Failed to load reels.")}
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

    const updateReelLikesCount = (reelId: string, likesCount: number) => {
        setReels((previousReels) =>
            previousReels.map((reel) =>
            reel.reelId === reelId
                ? {
                    ...reel,
                    stats: {
                        ...reel.stats,
                        likesCount,
                    },
                }
                : reel
            )
        )
    }

    const updateReelCommentsCount = useCallback(
        (reelId: string,commentsCount: number) => {
            setReels((currentReels) =>
                currentReels.map((reel) => {
                if (reel.reelId !== reelId) {
                    return reel
                }

                return {
                    ...reel,
                    stats: {
                    ...reel.stats,
                    commentsCount,
                    },
                }
                })
            )
        },
        []
    )

    return {
        reels,
        isLoading,
        error,
        updateReelCommentsCount,
        updateReelLikesCount,
    }
}