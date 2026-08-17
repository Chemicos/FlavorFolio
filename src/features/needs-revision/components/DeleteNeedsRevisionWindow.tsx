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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay)] px-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={[
                    "w-full max-w-[540px] rounded-2xl border p-8",
                    "border-[var(--border)]",
                    "bg-[var(--bg-secondary)]",
                    "shadow-[var(--shadow-dropdown)]",
                ].join(" ")}
            >
                <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]">
                    <DeleteRoundedIcon sx={{ fontSize: 30 }} />
                </div>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    className={[
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        "text-[var(--text-muted)] transition",
                        "hover:bg-[var(--surface-hover)]",
                        "hover:text-[var(--text-primary)]",
                        "disabled:cursor-not-allowed disabled:opacity-45",
                    ].join(" ")}
                >
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </button>
                </div>

                <h2 className="mt-6 text-xl font-bold text-[var(--text-primary)]">
                    Delete {recipes.length} recipe{recipes.length === 1 ? "" : "s"}?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    This action is permanent. The selected recipe
                    {recipes.length === 1 ? "" : "s"} will be removed from your revision list.
                </p>

                <div className="mt-5 max-h-[180px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
                {recipes.map((recipe) => (
                    <div
                        key={recipe.recipeId}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3"
                    >
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
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
                    className={[
                        "rounded-lg border px-5 py-3 text-sm font-medium",
                        "border-[var(--button-secondary-border)]",
                        "bg-[var(--button-secondary-bg)]",
                        "text-[var(--button-secondary-text)]",
                        "transition hover:bg-[var(--button-secondary-hover)]",
                        "hover:text-[var(--text-primary)]",
                        "disabled:cursor-not-allowed disabled:opacity-45",
                    ].join(" ")}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onConfirm(recipes.map((recipe) => recipe.recipeId))}
                    className={[
                        "inline-flex items-center gap-2 rounded-lg border px-5 py-3",
                        "border-[var(--button-danger-border)]",
                        "bg-[var(--button-danger-bg)]",
                        "text-sm font-semibold text-[var(--button-danger-text)]",
                        "transition hover:bg-[var(--button-danger-hover)]",
                        "disabled:cursor-not-allowed disabled:opacity-45",
                    ].join(" ")}
                >
                    {isSubmitting ? (
                        <CircularProgress size={14} thickness={5} sx={{ color: "var(--danger)" }} />
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
