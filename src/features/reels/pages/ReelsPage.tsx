import { useState } from "react";
import Navigation from "../../../components/layout/Navigation";
import ReelsFeed from "../components/ReelsFeed";
import { Reel } from "../types/reel.types";
import { useReels } from "../hooks/useReels";
import { AnimatePresence } from "motion/react";
import ReelCommentModal from "../components/ReelCommentModal";


export default function ReelsPage() {
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)

  const {
    reels,
    isLoading,
    error,
    updateReelCommentsCount,
  } = useReels()

  const activeSelectedReel = selectedReel
    ? reels.find(
        (reel) =>
          reel.reelId === selectedReel.reelId
      ) || selectedReel
    : null

  return (
     <>
        <Navigation />
        <main className="fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-[#0d0e11]">
          <ReelsFeed
            reels={reels}
            isLoading={isLoading}
            error={error}
            onCommentsClick={setSelectedReel}
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
        </main>
    </>
  )
}
