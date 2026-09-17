import { CircularProgress } from "@mui/material"
import { useReels } from "../hooks/useReels"
import ReelsEmptyState from "./ReelsEmptyState"
import ReelCard from "./ReelCard"
import { Reel } from "../types/reel.types"

interface ReelsFeedProps {
  reels: Reel[]
  isLoading: boolean
  error: string | null
  currentUserId: string | null
  likedReelIds: string[]
  savedReelIds: string[]
  onCommentsClick: (reel: Reel) => void
  onShareClick: (reel: Reel) => void
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
    onLikeStateChange,
    onSaveStateChange,
}: ReelsFeedProps) {
    // const { reels, isLoading, error } = useReels()

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
        <section className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reels.map((reel) => (
                <div
                    key={reel.reelId}
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
