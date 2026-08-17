import CircularProgress from "@mui/material/CircularProgress"

interface PostRecipeActionBarProps {
  mode: "form" | "preview"
  completionPercentage: number
  isSubmitting: boolean
  onPreview?: () => void
  onEdit?: () => void
  onPost: () => void
  submitLabel?: string
}

export default function PostRecipeActionBar({
    mode,
    completionPercentage,
    isSubmitting,
    onPreview,
    onEdit,
    onPost,
    submitLabel = "Post"
}: PostRecipeActionBarProps) {
    const canPost = completionPercentage === 100 && !isSubmitting
  return (
    <div className="sticky bottom-0 -mx-7 mt-8 flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-7 py-4 backdrop-blur-xl z-50">
        <button
            onClick={mode === "preview" ? onEdit : onPreview}
            disabled={isSubmitting}
            type="button"
            className="rounded-md px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
            {mode === "preview" ? "Edit recipe" : "Preview"}
        </button>

        <button
            type="button"
            disabled={!canPost}
            onClick={onPost}
            className={[
            "relative min-w-[118px] overflow-hidden rounded-md border px-6 py-2.5 text-sm font-semibold transition",
            canPost
                ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] hover:bg-[var(--accent-soft-hover)] active:scale-95"
                : "cursor-not-allowed border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-disabled)]",
            ].join(" ")}
        >
            {!canPost && (
                <span
                    className="absolute inset-y-0 left-0 bg-[var(--accent-soft-hover)] transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                />
            )}

            <span className="relative z-10 inline-flex items-center justify-center">
                {isSubmitting ? (
                    <CircularProgress size={18} thickness={5} sx={{ color: "var(--accent-text)" }} />
                ) : canPost ? submitLabel : `${completionPercentage}%`}
            </span>
        </button>
    </div>
  )
}
