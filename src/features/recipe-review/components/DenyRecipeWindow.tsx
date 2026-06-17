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
        className="w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#16181d] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0b0b0c] text-[#c7d0ee]">
            <BlockRoundedIcon sx={{ fontSize: 35 }} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a8b3cf] transition hover:bg-white/[0.05] hover:text-white"
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <h2 className="mt-6 text-xl font-bold text-white">
          Reject {recipes.length} recipe{recipes.length === 1 ? "" : "s"}?
        </h2>

        <p className="mt-3 max-w-[420px] text-xs leading-6 text-[#c7d0ee]">
          The selected recipe{recipes.length === 1 ? "" : "s"} will be rejected and the author
          {recipes.length === 1 ? "" : "s"} will be notified.
        </p>

        <div className="mt-4 max-h-[180px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
          {recipes.map((recipe) => (
            <div
              key={recipe.recipeId}
              className="flex items-center justify-between gap-4 rounded-xl bg-[#0b0b0c] px-4 py-2"
            >
              <p className="min-w-0 truncate text-xs text-[#d7def0]">
                {recipe.title || "Untitled recipe"}
              </p>

              <div className="flex shrink-0 items-center gap-3">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                  {recipe.author?.profileImage ? (
                    <img
                      src={recipe.author.profileImage}
                      alt={recipe.author?.username || recipe.user || "Author"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                      {(recipe.author?.username || recipe.user || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="max-w-[110px] truncate text-xs text-[#c7d0ee]">
                  {recipe.author?.username || recipe.user || "Unknown"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-semibold text-white">
              Select reason
            </label>

            <span className="rounded-md bg-[#151821] px-2 py-1 text-[11px] text-[#a8b3cf]">
              required
            </span>
          </div>

          <div className="relative w-full max-w-[320px]">
            <button
              type="button"
              onClick={() => setIsReasonMenuOpen((prev) => !prev)}
              className={[
                "flex h-13 w-full items-center justify-between rounded-lg border bg-transparent px-4 py-3 text-left text-xs transition",
                selectedReason
                  ? "border-orange-400/40 text-white"
                  : "border-[#6f7892]/70 text-[#a8b3cf] hover:border-white/25",
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
                  className="absolute left-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                >
                  {denyReasons.map((reason) => {
                    const isSelected = reason.value === selectedReason

                    return (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => handleSelectReason(reason.value)}
                        className={[
                          "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs transition",
                          isSelected
                            ? "bg-orange-500/15 text-orange-200"
                            : "text-[#c7d0ee] hover:bg-white/[0.04] hover:text-white",
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
          className="mt-4 min-h-[140px] w-full resize-none rounded-xl border border-white/10 bg-[#0b0b0c] px-4 py-4 text-xs leading-6 text-white outline-none placeholder:text-[#9aa6c7] focus:border-orange-400/35"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-lg px-5 py-3 text-sm font-medium text-[#c7d0ee] transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedReason || isSubmitting}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/10 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? (
              <CircularProgress size={15} thickness={5} sx={{color: "#fca5a5"}} />
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
