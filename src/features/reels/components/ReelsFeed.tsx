import { CircularProgress } from "@mui/material"
import { useReels } from "../hooks/useReels"
import ReelsEmptyState from "./ReelsEmptyState"
import ReelCard from "./ReelCard"


export default function ReelsFeed() {
    const { reels, isLoading, error } = useReels()

    if (isLoading) {
        return (
        <div className="flex h-full items-center justify-center">
            <CircularProgress size={34} sx={{ color: "#feaa2b" }} />
        </div>
        )
    }

    if (error) {
        return (
        <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                {error}
            </div>
        </div>
        )
    }

    if (!reels.length) return <ReelsEmptyState />

    return (
        <section className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reels.map((reel) => (
                <div
                    key={reel.reelId}
                    className="flex h-full snap-start items-center justify-center px-4 py-6"
                >
                    <ReelCard reel={reel} />
                </div>
            ))}
        </section>
    )
}
