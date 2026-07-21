import { useState } from "react";
import Navigation from "../../../components/layout/Navigation";
import ReelsFeed from "../components/ReelsFeed";
import { Reel } from "../types/reel.types";
import { useReels } from "../hooks/useReels";
import { AnimatePresence } from "motion/react";
import ReelCommentModal from "../components/ReelCommentModal";
import { useLikedReels } from "../hooks/useLikedReels";
import { SharedReelMessage } from "../../messages/types/messages.types";
import ShareRecipeModal from "../../messages/components/ShareRecipeModal";
import { useSnackbar } from "../../../components/layout/SnackbarProvider";


export default function ReelsPage() {
  const { showSnackbar } = useSnackbar()
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const [reelToShare, setReelToShare] = useState<SharedReelMessage | null>(null)

  const {
    reels,
    isLoading,
    error,
    updateReelCommentsCount,
    updateReelLikesCount,
  } = useReels()

  const {currentUserId, likedReelIds,} = useLikedReels()

  const activeSelectedReel = selectedReel
    ? reels.find(
        (reel) =>
          reel.reelId === selectedReel.reelId
      ) || selectedReel
    : null

  const handleOpenShareReel = (
    reel: Reel
  ) => {
    setReelToShare({
      reelId: reel.reelId,
      title:
        reel.title || "Recipe reel",
      description:
        reel.description || "",
      videoUrl:
        reel.videoUrl || "",
      thumbnail:
        reel.thumbnail || "",
      authorUsername:
        reel.author?.username || "Unknown",
      meal:
        reel.meal || "",
      durationSeconds: Number(
        reel.duration || 0
      ),
    })
  }

  return (
     <>
        <Navigation />
        <main className="fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-[#0d0e11]">
          <ReelsFeed
            reels={reels}
            isLoading={isLoading}
            error={error}
            currentUserId={currentUserId}
            likedReelIds={likedReelIds}
            onCommentsClick={setSelectedReel}
            onShareClick={handleOpenShareReel}
            onLikeStateChange={(
              reelId,
              _isLiked,
              likesCount
            ) => {
              updateReelLikesCount(
                reelId,
                likesCount
              )
            }}
          />

          <AnimatePresence>
            {activeSelectedReel && (
              <ReelCommentModal
                key={activeSelectedReel.reelId}
                reel={activeSelectedReel}
                onClose={() =>
                  setSelectedReel(null)
                }
                onCommentsCountChange={
                  updateReelCommentsCount
                }
              />
            )}
          </AnimatePresence>

          <ShareRecipeModal
            isOpen={Boolean(reelToShare)}
            currentUserId={currentUserId}
            reel={reelToShare}
            onClose={() =>
              setReelToShare(null)
            }
            onShared={(username) => {
              showSnackbar(
                `Reel shared with ${username}.`,
                "success"
              )

              setReelToShare(null)
            }}
          />
        </main>
    </>
  )
}
