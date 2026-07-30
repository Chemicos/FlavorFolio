import { AnimatePresence, motion } from "motion/react"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"

interface ScrollToBottomButtonProps {
  onClick?: () => void
  isVisible?: boolean
}

export default function ScrollToBottomButton({ onClick, isVisible }: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute bottom-5 right-6 z-20"
        >
          <button
            type="button"
            onClick={onClick}
            aria-label="Scroll to latest message"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--button-secondary-border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-[var(--shadow-card)] transition duration-200 hover:border-[var(--accent-border)] hover:bg-[var(--button-secondary-hover)] hover:text-[var(--accent-text)] active:scale-95"
          >
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 26 }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
