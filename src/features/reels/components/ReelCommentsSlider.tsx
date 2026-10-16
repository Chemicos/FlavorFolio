import { useMediaQuery } from "@mui/material"
import { AnimatePresence, motion } from "motion/react"
import { ReactNode, useEffect } from "react"

interface ReelCommentsSliderProps {
  isCommentsOpen: boolean
  onCloseComments: () => void
  reel: ReactNode
  comments: ReactNode
}

const springTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 32,
  mass: 0.9,
}

const REEL_WIDTH = 460
const COMMENTS_WIDTH = 420
const PANEL_GAP = 8

export default function ReelCommentsSlider({
  isCommentsOpen,
  onCloseComments,
  reel,
  comments,
}: ReelCommentsSliderProps) {
  const isDesktop = useMediaQuery("(min-width: 960px)")

  useEffect(() => {
    if (!isCommentsOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation()
        onCloseComments()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isCommentsOpen, onCloseComments])

  const expandedWidth = REEL_WIDTH + PANEL_GAP + COMMENTS_WIDTH

  return (
    <motion.div
      initial={false}
      animate={{
        width:
          isDesktop && isCommentsOpen
            ? expandedWidth
            : REEL_WIDTH,
      }}
      transition={springTransition}
      style={{
        maxWidth: "calc(100vw - 40px)",
      }}
      className="relative mx-auto shrink-0"
      onClick={(event) => event.stopPropagation()}
    >
      <AnimatePresence initial={false}>
        {isCommentsOpen && (
          <motion.div
            key="reel-comments-panel"
            initial={
              isDesktop
                ? { x: -COMMENTS_WIDTH - PANEL_GAP }
                : { x: "100%" }
            }
            animate={{ x: 0 }}
            exit={
              isDesktop
                ? { x: -COMMENTS_WIDTH - PANEL_GAP }
                : { x: "100%" }
            }
            transition={springTransition}
            className={[
              "absolute top-0 h-full",
              isDesktop
                ? "left-[468px] z-0 w-[420px]"
                : "inset-x-0 z-20 w-full",
            ].join(" ")}
          >
            {comments}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-fit max-w-full">
        {reel}
      </div>
    </motion.div>
  )
}