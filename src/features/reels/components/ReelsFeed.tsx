import { CircularProgress } from "@mui/material"
import { useReels } from "../hooks/useReels"
import ReelsEmptyState from "./ReelsEmptyState"
import ReelCard from "./ReelCard"
import { Reel } from "../types/reel.types"
import { useEffect, useRef } from "react"

interface ReelsFeedProps {
  reels: Reel[]
  isLoading: boolean
  error: string | null
  currentUserId: string | null
  likedReelIds: string[]
  savedReelIds: string[]
  onCommentsClick: (reel: Reel) => void
  onShareClick: (reel: Reel) => void
  onActiveReelChange?: (reelId: string) => void
  onLikeStateChange: (
    reelId: string,
    isLiked: boolean,
    likesCount: number
  ) => void
  onSaveStateChange: (
    reelId: string,
    isSaved: boolean,
    savesCount: number
  ) => void
}

export default function ReelsFeed({
    reels,
    isLoading,
    error,
    currentUserId,
    likedReelIds,
    savedReelIds,
    onCommentsClick,
    onShareClick,
    onActiveReelChange,
    onLikeStateChange,
    onSaveStateChange,
}: ReelsFeedProps) {
    const feedRef = useRef<HTMLElement | null>(null)

    const onActiveReelChangeRef = useRef(onActiveReelChange)

    useEffect(() => {
        onActiveReelChangeRef.current = onActiveReelChange
    }, [onActiveReelChange])

    useEffect(() => {
        const feed = feedRef.current

        if (!feed || isLoading || error || reels.length === 0) {
            return
        }

        const reelElements = feed.querySelectorAll<HTMLElement>("[data-reel-id]")

        let activeReelId: string | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          const reelId = (
            entry.target as HTMLElement
          ).dataset.reelId

          if (!reelId || reelId === activeReelId) {
            continue
          }

          activeReelId = reelId

          onActiveReelChangeRef.current?.(reelId)
        }
      },
      {
        root: feed,
        threshold: 0.6,
      }
    )

    reelElements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [reels, isLoading, error])

    if (isLoading) {
        return (
        <div className="flex h-full items-center justify-center">
            <CircularProgress size={34} sx={{ color: "var(--accent)" }} />
        </div>
        )
    }

    if (error) {
        return (
        <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-5 py-4 text-sm text-[var(--danger-text)]">
                {error}
            </div>
        </div>
        )
    }

    if (!reels.length) return <ReelsEmptyState />

    return (
        <section ref={feedRef} className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reels.map((reel) => (
                <div
                    key={reel.reelId}
                    data-reel-id={reel.reelId}
                    className="flex h-full snap-start items-center justify-center px-4 py-6"
                >
                <ReelCard
                    reel={reel}
                    currentUserId={currentUserId}
                    isLiked={likedReelIds.includes(reel.reelId)}
                    isSaved={savedReelIds.includes(reel.reelId)}
                    onCommentsClick={onCommentsClick}
                    onShareClick={onShareClick}
                    onLikeStateChange={onLikeStateChange}
                    onSaveStateChange={onSaveStateChange}
                />
                </div>
            ))}
        </section>
    )
}
