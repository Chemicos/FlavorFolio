import { CircularProgress } from "@mui/material"
import { AnimatePresence, motion } from "motion/react"
import { useEffect } from "react"
import { createPortal } from "react-dom"

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
  useEffect(() => {
    if (!isOpen) return

    const body = document.body
    const scrollY = window.scrollY
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    }

    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0

    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.overflow = "hidden"

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${
        currentPaddingRight + scrollbarWidth
      }px`
    }

    return () => {
      body.style.position = previousStyles.position
      body.style.top = previousStyles.top
      body.style.left = previousStyles.left
      body.style.right = previousStyles.right
      body.style.width = previousStyles.width
      body.style.overflow = previousStyles.overflow
      body.style.paddingRight = previousStyles.paddingRight

      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: "auto",
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (isDeleting) return

      onCancel()
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, isDeleting, onCancel])

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.18,
            ease: "easeOut",
          }}
          onClick={() => {
            if (isDeleting) return
            onCancel()
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--overlay)] px-4 backdrop-blur-[3px]"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-warning-title"
            aria-describedby="delete-warning-description"
            initial={{opacity: 0,y: 12,scale: 0.96,}}
            animate={{opacity: 1, y: 0, scale: 1,}}
            exit={{opacity: 0, y: 12, scale: 0.96,}}
            transition={{duration: 0.2, ease: [0.22, 1, 0.36, 1],}}
            onClick={(event) => event.stopPropagation()}
            className={[
              "w-full max-w-[450px] rounded-xl border p-6",
              "border-[var(--border)] bg-[var(--bg-elevated)]",
              "shadow-[var(--shadow-dropdown)]",
              "transition-colors duration-200",
            ].join(" ")}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]">
              <span className="text-xl font-bold">!</span>
            </div>

            <h3
              id="delete-warning-title"
              className="mt-4 text-lg font-bold text-[var(--text-primary)]"
            >
              {title}
            </h3>

            <p
              id="delete-warning-description"
              className="mt-2 text-sm leading-6 text-[var(--text-secondary)]"
            >
              {description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onCancel}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-medium",
                  "border-transparent text-[var(--text-secondary)]",
                  "transition-colors duration-200",
                  "hover:border-[var(--button-secondary-border)]",
                  "hover:bg-[var(--button-secondary-hover)]",
                  "hover:text-[var(--text-primary)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className={[
                  "inline-flex min-w-[92px] items-center justify-center rounded-lg border px-4 py-2",
                  "border-[var(--danger-border)] bg-[var(--danger-soft)]",
                  "text-sm font-semibold text-[var(--danger-text)]",
                  "transition-colors duration-200",
                  "hover:border-[var(--danger)] hover:bg-[var(--danger-soft-hover)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--danger-soft)]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                {isDeleting ? (
                  <CircularProgress
                    size={16}
                    thickness={5}
                    sx={{ color: "var(--danger-text)" }}
                  />
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
