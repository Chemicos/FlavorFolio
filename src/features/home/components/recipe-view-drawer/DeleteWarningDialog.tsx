import { CircularProgress } from "@mui/material"
import { AnimatePresence, motion } from "motion/react"

interface DeleteWarningDialogProps {
  isOpen: boolean
  isDeleting?: boolean
  title?: string
  description?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteWarningDialog({
  isOpen,
  isDeleting = false,
  title = "Delete item?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: DeleteWarningDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15 px-4 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
          >
            <h3 className="text-lg font-bold text-white">{title}</h3>

            <p className="mt-2 text-sm leading-6 text-[#a8b3cf]">
              {description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="inline-flex min-w-[82px] items-center justify-center rounded-lg bg-[#db4633]/15 px-4 py-2 text-sm font-medium text-[#ff8b7d] transition hover:bg-[#db4633]/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <CircularProgress size={16} thickness={5} sx={{ color: "#ff8b7d" }} />
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
