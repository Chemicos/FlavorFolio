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
  canEdit?: boolean
}

const severityStyles = {
    info: {
        selected: "border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]",
        icon: "text-[var(--info)]",
    },
    warning: {
        selected: "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]",
        icon: "text-[var(--warning)]",
    },
    critical: {
        selected: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]",
        icon: "text-[var(--danger)]",
    }
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
    canEdit = true,
}: RecipeReviewSectionHeaderProps) {
    const hasFeedback = Boolean(feedback?.message?.trim())
    const feedbackSeverity = feedback?.severity && feedback.severity in severityStyles ? feedback.severity : "warning"

  return (
    <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>

            {hasFeedback && (
            <Tooltip
                title={feedback?.message}
                arrow
                placement="top"
                slotProps={{
                    tooltip: {
                        sx: {
                        maxWidth: 360,
                            bgcolor: "var(--tooltip-bg)",
                            color: "var(--tooltip-text)",
                            fontSize: "0.75rem",
                            lineHeight: 1.55,
                            border: "1px solid var(--tooltip-border)",
                            boxShadow: "var(--shadow-dropdown)",
                            px: 1.2,
                            py: 0.8,r: "1px solid rgba(255,255,255,0.08)",
                        },
                    },
                    arrow: {
                        sx: {
                            color: "var(--tooltip-bg)",
                            "&:before": {
                            border:
                                "1px solid var(--tooltip-border)",
                            },
                        },
                    },
                }}
            >
                <WarningIcon
                    sx={{ fontSize: 19 }}
                    className={severityStyles[feedbackSeverity].icon}
                />
            </Tooltip>
            )}
        </div>
        {canEdit && (
            <button
                type="button"
                onClick={onStartEdit}
                className={[
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg",
                    "px-3 py-1.5 text-xs",
                    "text-[var(--text-secondary)] transition",
                    "hover:bg-[var(--surface-hover)]",
                    "hover:text-[var(--text-primary)]",
                    "active:scale-[0.98]",
                ].join(" ")}
            >
                <AddCommentRoundedIcon sx={{ fontSize: 16 }} />
                Feedback
            </button>
        )}
        </div>

        <AnimatePresence initial={false}>
            {isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={[
                        "mt-3 overflow-hidden rounded-xl border p-3",
                        "border-[var(--border)]",
                        "bg-[var(--surface-subtle)]",
                    ].join(" ")}
                >
                <div className="flex flex-wrap gap-2">
                    {(["info", "warning", "critical"] as const).map((severity) => {
                    const isSelected = draftSeverity === severity

                    return (
                    <button
                        key={severity}
                        type="button"
                        onClick={() =>
                        onSeverityChange(severity)
                        }
                        className={[
                        "rounded-lg border px-3 py-1.5",
                        "text-xs capitalize transition",
                        isSelected
                            ? severityStyles[severity].selected
                            : [
                                "border-transparent",
                                "text-[var(--text-muted)]",
                                "hover:border-[var(--border)]",
                                "hover:bg-[var(--surface-hover)]",
                                "hover:text-[var(--text-primary)]",
                            ].join(" "),
                        ].join(" ")}
                    >
                        {severity}
                    </button>
                    )
                })}
                </div>

                <textarea
                    value={draftMessage}
                    onChange={(event) => onMessageChange(event.target.value)}
                    placeholder="Write what needs to be corrected..."
                    className={[
                        "mt-3 min-h-[90px] w-full resize-none rounded-lg border",
                        "border-[var(--input-border)]",
                        "bg-[var(--input-bg)]",
                        "px-3 py-2 text-sm text-[var(--text-primary)]",
                        "outline-none transition",
                        "placeholder:text-[var(--input-placeholder)]",
                        "hover:bg-[var(--input-bg-hover)]",
                        "focus:border-[var(--focus-border)]",
                        "focus:ring-2 focus:ring-[var(--focus-ring)]",
                    ].join(" ")}    
                />

                <div className="mt-3 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        disabled={isSaving}
                        className={[
                            "rounded-lg px-3 py-2 text-xs",
                            "text-[var(--text-muted)] transition",
                            "hover:bg-[var(--surface-hover)]",
                            "hover:text-[var(--text-primary)]",
                            "disabled:cursor-not-allowed",
                            "disabled:opacity-50",
                        ].join(" ")}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onSave}
                        className={[
                            "inline-flex min-w-[104px] items-center justify-center",
                            "rounded-lg border px-3 py-2",
                            "border-[var(--accent-border)]",
                            "bg-[var(--accent-soft)]",
                            "text-xs font-medium text-[var(--accent-text)]",
                            "transition",
                            "hover:bg-[var(--accent-soft-hover)]",
                            "disabled:cursor-not-allowed",
                            "disabled:opacity-50",
                        ].join(" ")}
                    >
                    {isSaving ? (
                        <CircularProgress size={14} thickness={5} sx={{color: "var(--accent)"}} />
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
