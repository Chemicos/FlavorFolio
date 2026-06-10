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
    <div className="sticky bottom-0 -mx-7 mt-8 flex justify-end gap-3 border-t border-white/10 bg-[#16181d]/95 px-7 py-4 backdrop-blur-xl z-50">
        <button
            onClick={mode === "preview" ? onEdit : onPreview}
            disabled={isSubmitting}
            type="button"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
            {mode === "preview" ? "Edit recipe" : "Preview"}
        </button>

        <button
            type="button"
            disabled={!canPost}
            onClick={onPost}
            className={[
            "relative min-w-[118px] overflow-hidden rounded-lg border px-6 py-2.5 text-sm font-semibold transition",
            canPost
                ? "border-orange-400/40 bg-orange-500/20 text-orange-100 hover:bg-orange-500/30 active:scale-95"
                : "cursor-not-allowed border-orange-400/10 bg-orange-500/5 text-orange-200/60",
            ].join(" ")}
        >
            {!canPost && (
                <span
                    className="absolute inset-y-0 left-0 bg-orange-500/15 transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                />
            )}

            <span className="relative z-10 inline-flex items-center justify-center">
                {isSubmitting ? (
                    <CircularProgress size={18} thickness={5} sx={{ color: "#fed7aa" }} />
                ) : canPost ? submitLabel : `${completionPercentage}%`}
            </span>
        </button>
    </div>
  )
}
