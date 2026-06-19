import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { NeedsRevisionRecipe } from "../types/needsRevision.types"
import { motion } from "motion/react"
import { CircularProgress } from "@mui/material"

interface DeleteNeedsRevisionWindowProps {
  isOpen: boolean
  recipes: NeedsRevisionRecipe[]
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (recipeIds: string[]) => void
}

export default function DeleteNeedsRevisionWindow({
    isOpen,
    recipes,
    isSubmitting = false,
    onClose,
    onConfirm, 
}: DeleteNeedsRevisionWindowProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[540px] rounded-2xl border border-white/10 bg-[#16181d] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            >
                <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                    <DeleteRoundedIcon sx={{ fontSize: 30 }} />
                </div>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a8b3cf] transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </button>
                </div>

                <h2 className="mt-6 text-xl font-bold text-white">
                Delete {recipes.length} recipe{recipes.length === 1 ? "" : "s"}?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#a8b3cf]">
                This action is permanent. The selected recipe
                {recipes.length === 1 ? "" : "s"} will be removed from your revision list.
                </p>

                <div className="mt-5 max-h-[180px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(168,179,207,0.35)_transparent]">
                {recipes.map((recipe) => (
                    <div
                    key={recipe.recipeId}
                    className="rounded-xl bg-[#0b0b0c] px-4 py-3"
                    >
                    <p className="truncate text-sm font-medium text-[#d7def0]">
                        {recipe.title || "Untitled recipe"}
                    </p>
                    </div>
                ))}
                </div>

                <div className="mt-7 flex justify-end gap-2">
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
                    disabled={isSubmitting}
                    onClick={() => onConfirm(recipes.map((recipe) => recipe.recipeId))}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-400/10 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    {isSubmitting ? (
                    <CircularProgress size={14} thickness={5} sx={{ color: "#fca5a5" }} />
                    ) : (
                    <>
                        <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                        Delete
                    </>
                    )}
                </button>
                </div>
            </motion.div>
        </div>
    )
}
