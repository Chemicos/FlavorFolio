import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import { AnimatePresence, motion } from "motion/react"

interface MessageImagePreviewModalProps {
    imageUrl: string | null
    onClose: () => void
}

export default function MessageImagePreviewModal({
    imageUrl,
    onClose,
}: MessageImagePreviewModalProps) {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 top-16 z-[80] flex items-center justify-center bg-[var(--overlay)] px-6 py-10 backdrop-blur-xl"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <CloseRoundedIcon sx={{ fontSize: 22 }} />
          </button>

          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="absolute right-20 top-6 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent-text)]"
          >
            <OpenInNewRoundedIcon sx={{ fontSize: 20 }} />
          </a>

          <motion.img
            src={imageUrl}
            alt="Message attachment preview"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[86vh] max-w-[92vw] rounded-2xl border border-[var(--border)] object-contain shadow-[var(--shadow-panel)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
