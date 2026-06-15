import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded"
import WarningIcon from '@mui/icons-material/Warning';
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import Tooltip from "@mui/material/Tooltip"
import { CircularProgress } from "@mui/material"
import { AnimatePresence, motion } from "motion/react";

export type ReviewIssueSeverity = "info" | "warning" | "critical" | null

export interface ReviewSectionFeedback {
  message: string
  severity: ReviewIssueSeverity
}

interface RecipeReviewSectionHeaderProps {
  title: string
  feedback?: ReviewSectionFeedback
  isEditing: boolean
  draftMessage: string
  draftSeverity: ReviewIssueSeverity
  isSaving?: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onMessageChange: (value: string) => void
  onSeverityChange: (value: ReviewIssueSeverity) => void
}

export default function RecipeReviewSectionHeader({
    title,
    feedback,
    isEditing,
    draftMessage,
    draftSeverity,
    isSaving = false,
    onStartEdit,
    onCancelEdit,
    onSave,
    onMessageChange,
    onSeverityChange,
}: RecipeReviewSectionHeaderProps) {
    const hasFeedback = Boolean(feedback?.message?.trim())

  return (
    <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{title}</h2>

            {hasFeedback && (
            <Tooltip
                title={feedback?.message}
                arrow
                placement="top"
                slotProps={{
                tooltip: {
                    sx: {
                    bgcolor: "#0b0b0c",
                    color: "#d7def0",
                    fontSize: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    },
                },
                arrow: { sx: { color: "#0b0b0c" } },
                }}
            >
                <WarningIcon
                sx={{ fontSize: 19 }}
                className={
                    feedback?.severity === "critical"
                    ? "text-red-300"
                    : feedback?.severity === "warning"
                    ? "text-orange-300"
                    : "text-sky-300"
                }
                />
            </Tooltip>
            )}
        </div>

        <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white"
        >
            <AddCommentRoundedIcon sx={{ fontSize: 16 }} />
            Feedback
        </button>
        </div>

        <AnimatePresence initial={false}>
            {isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 rounded-xl border border-white/10 bg-[#0b0b0c] p-3"
                >
                <div className="flex gap-2">
                    {(["info", "warning", "critical"] as const).map((severity) => (
                    <button
                        key={severity}
                        type="button"
                        onClick={() => onSeverityChange(severity)}
                        className={[
                        "rounded-lg px-3 py-1.5 text-xs capitalize transition",
                        draftSeverity === severity
                            ? "bg-orange-500/15 text-orange-200"
                            : "text-[#7f89a6] hover:bg-white/[0.04] hover:text-white",
                        ].join(" ")}
                    >
                        {severity}
                    </button>
                    ))}
                </div>

                <textarea
                    value={draftMessage}
                    onChange={(event) => onMessageChange(event.target.value)}
                    placeholder="Write what needs to be corrected..."
                    className="mt-3 min-h-[90px] w-full resize-none rounded-lg border border-white/10 bg-[#101215] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6f7892] focus:border-orange-400/30"
                />

                <div className="mt-3 flex justify-end gap-2">
                    <button
                    type="button"
                    onClick={onCancelEdit}
                    className="rounded-lg px-3 py-2 text-xs text-[#7f89a6] transition hover:bg-white/[0.04] hover:text-white"
                    >
                    Cancel
                    </button>

                    <button
                    type="button"
                    disabled={isSaving}
                    onClick={onSave}
                    className="rounded-lg bg-orange-500/15 px-3 py-2 text-xs font-medium text-orange-200 transition hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {isSaving ? (
                        <CircularProgress size={14} thickness={5} sx={{color: "#fed7aa"}} />
                    ) : (
                        "Save feedback"
                    )}
                    </button>
                </div>
                </motion.div>
            )}
        </AnimatePresence>    
    </div>    
  )
}
