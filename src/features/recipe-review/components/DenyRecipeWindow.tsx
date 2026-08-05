import BlockRoundedIcon from "@mui/icons-material/BlockRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ReviewRecipe } from "../types/recipeReview.types"
import { CircularProgress } from "@mui/material"

interface DenyRecipeWindowProps {
  recipes: ReviewRecipe[]
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (payload: {
    reason: string
    message: string
    recipeIds: string[]
  }) => void
}

const denyReasons = [
  {
    value: "missing_information",
    label: "Missing information",
    defaultMessage:
      "Your recipe was rejected because some required information is missing or incomplete. Please review the highlighted feedback and submit it again.",
  },
  {
    value: "unclear_steps",
    label: "Unclear cooking steps",
    defaultMessage:
      "Your recipe was rejected because the cooking steps are unclear. Please rewrite the instructions so they are easier to follow.",
  },
  {
    value: "invalid_ingredients",
    label: "Invalid or incomplete ingredients",
    defaultMessage:
      "Your recipe was rejected because the ingredients list is incomplete or contains invalid quantities.",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate content",
    defaultMessage:
      "Your recipe was rejected because it contains content that does not follow our community guidelines.",
  },
  {
    value: "other",
    label: "Other reason",
    defaultMessage:
      "Your recipe was rejected. Please review the feedback provided by the administrator and submit a corrected version.",
  },
]

export default function DenyRecipeWindow({
    recipes,
    isOpen,
    isSubmitting = false,
    onClose,
    onConfirm,
}: DenyRecipeWindowProps) {
    const [selectedReason, setSelectedReason] = useState("")
    const [message, setMessage] = useState("")
    const [isReasonMenuOpen, setIsReasonMenuOpen] = useState(false)

    const selectedReasonData = useMemo(
        () => denyReasons.find((reason) => reason.value === selectedReason),
        [selectedReason]
    )
   
    const handleSelectReason = (reasonValue: string) => {
        const reason = denyReasons.find((item) => item.value === reasonValue)

        setSelectedReason(reasonValue)
        setMessage(reason?.defaultMessage || "")
        setIsReasonMenuOpen(false)
    }

    const handleConfirm = () => {
        if (!selectedReason) return

        onConfirm({
            reason: selectedReason,
            message,
            recipeIds: recipes.map((recipe) => recipe.recipeId),
        })
    }

    if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[560px] rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 shadow-[var(--shadow-panel)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div 
            className={[
              "flex h-16 w-16 items-center justify-center rounded-xl border",
              "border-[var(--danger-border)]",
              "bg-[var(--danger-soft)]",
              "text-[var(--danger-text)]",
            ].join(" ")}
          >
            <BlockRoundedIcon sx={{ fontSize: 35 }} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg",
              "text-[var(--text-secondary)] transition",
              "hover:bg-[var(--surface-hover)]",
              "hover:text-[var(--text-primary)]",
              "active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-45",
            ].join(" ")}
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <h2 className="mt-6 text-xl font-bold text-[var(--text-primary)]">
          Reject {recipes.length} recipe{recipes.length === 1 ? "" : "s"}?
        </h2>

        <p className="mt-3 max-w-[420px] text-xs leading-6 text-[var(--text-secondary)]">
          The selected recipe{recipes.length === 1 ? "" : "s"} will be rejected and the author
          {recipes.length === 1 ? "" : "s"} will be notified.
        </p>

        <div className="mt-4 max-h-[180px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
          {recipes.map((recipe) => (
            <div
              key={recipe.recipeId}
              className={[
                "flex items-center justify-between gap-4 rounded-xl border px-4 py-2",
                "border-[var(--border-subtle)]",
                "bg-[var(--input-bg)]",
              ].join(" ")}
            >
              <p className="min-w-0 truncate text-xs text-[var(--text-primary)]">
                {recipe.title || "Untitled recipe"}
              </p>

              <div className="flex shrink-0 items-center gap-3">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  {recipe.author?.profileImage ? (
                    <img
                      src={recipe.author.profileImage}
                      alt={recipe.author?.username || recipe.user || "Author"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                      {(recipe.author?.username || recipe.user || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="max-w-[110px] truncate text-xs text-[var(--text-secondary)]">
                  {recipe.author?.username || recipe.user || "Unknown"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-semibold text-[var(--text-primary)]">
              Select reason
            </label>

            <span
              className={[
                "rounded-md border px-2 py-1 text-[11px]",
                "border-[var(--warning-border)]",
                "bg-[var(--warning-soft)]",
                "text-[var(--warning-text)]",
              ].join(" ")}
            >
              required
            </span>
          </div>

          <div className="relative w-full max-w-[320px]">
            <button
              type="button"
              onClick={() => setIsReasonMenuOpen((prev) => !prev)}
              className={[
                "flex min-h-12 w-full items-center justify-between rounded-lg border",
                "bg-[var(--input-bg)] px-4 py-3 text-left text-xs",
                "outline-none transition",
                "focus:ring-2 focus:ring-[var(--focus-ring)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selectedReason
                  ? [
                      "border-[var(--focus-border)]",
                      "text-[var(--text-primary)]",
                    ].join(" ")
                  : [
                      "border-[var(--input-border)]",
                      "text-[var(--text-secondary)]",
                      "hover:border-[var(--border-strong)]",
                      "hover:bg-[var(--input-bg-hover)]",
                    ].join(" "),
              ].join(" ")}
            >
              <span>{selectedReasonData?.label || "Choose reason"}</span>

              <motion.span
                animate={{ rotate: isReasonMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.16 }}
              >
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 22 }} />
              </motion.span>
            </button>

            <AnimatePresence>
              {isReasonMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className={[
                    "absolute left-0 top-[calc(100%+8px)] z-20 w-full",
                    "overflow-hidden rounded-lg border p-1",
                    "border-[var(--border)]",
                    "bg-[var(--dropdown-bg)]",
                    "shadow-[var(--shadow-dropdown)]",
                  ].join(" ")}
                >
                  {denyReasons.map((reason) => {
                    const isSelected = reason.value === selectedReason

                    return (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => handleSelectReason(reason.value)}
                        className={[
                          "flex w-full items-center justify-between rounded-md px-3 py-2.5",
                          "text-left text-xs transition",
                          isSelected
                            ? [
                                "bg-[var(--dropdown-selected)]",
                                "text-[var(--accent-text)]",
                              ].join(" ")
                            : [
                                "text-[var(--text-secondary)]",
                                "hover:bg-[var(--dropdown-hover)]",
                                "hover:text-[var(--text-primary)]",
                              ].join(" "),
                        ].join(" ")}
                      >
                        <span>{reason.label}</span>
                        {isSelected && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Your recipe was rejected because..."
          className={[
            "mt-4 min-h-[140px] w-full resize-none rounded-xl border",
            "border-[var(--input-border)] bg-[var(--input-bg)]",
            "px-4 py-4 text-xs leading-6 text-[var(--text-primary)]",
            "outline-none transition",
            "placeholder:text-[var(--input-placeholder)]",
            "hover:bg-[var(--input-bg-hover)]",
            "focus:border-[var(--focus-border)]",
            "focus:ring-2 focus:ring-[var(--focus-ring)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className={[
              "rounded-lg border px-5 py-3 text-sm font-medium transition",
              "border-[var(--button-secondary-border)]",
              "bg-[var(--button-secondary-bg)]",
              "text-[var(--button-secondary-text)]",
              "hover:bg-[var(--button-secondary-hover)]",
              "hover:text-[var(--text-primary)]",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-45",
            ].join(" ")}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedReason || isSubmitting}
            onClick={handleConfirm}
            className={[
              "inline-flex min-w-[112px] items-center justify-center gap-2 rounded-lg border",
              "border-[var(--button-danger-border)]",
              "bg-[var(--button-danger-bg)]",
              "px-5 py-3 text-sm font-semibold",
              "text-[var(--button-danger-text)]",
              "transition",
              "hover:bg-[var(--button-danger-hover)]",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-45",
            ].join(" ")}
          >
            {isSubmitting ? (
              <CircularProgress size={15} thickness={5} sx={{color: "var(--button-danger-text)"}} />
            ): (
              <>
                <BlockRoundedIcon sx={{ fontSize: 18 }} />
                Deny
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
