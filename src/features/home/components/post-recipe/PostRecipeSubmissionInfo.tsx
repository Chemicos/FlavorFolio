import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded"
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { motion } from "motion/react"

interface PostRecipeSubmissionInfoProps {
  onContinue: () => void
}

export default function PostRecipeSubmissionInfo({onContinue}: PostRecipeSubmissionInfoProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[120] flex items-center justify-center bg-black/50 px-5 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 shadow-[var(--shadow-panel)]"
      >
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-muted)]">
            <GppGoodRoundedIcon sx={{ fontSize: 45, color: "var(--text-secondary)" }} />
          </div>

          <div className="absolute bottom-1 left-[60px] flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
          </div>
        </div>

        <h2 className="mt-8 text-[1.2rem] font-semibold leading-[2.35rem] text-[var(--text-primary)]">
          Your recipe will be reviewed before publishing
        </h2>

        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          Before your recipe goes live, it will be reviewed by an administrator
          to make sure it meets our community and quality guidelines.
        </p>

        <h3 className="mt-7 text-[1rem] font-semibold text-[var(--text-primary)]">
          You'll be notified in both cases:
        </h3>

        <div className="mt-5 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <CheckRoundedIcon sx={{ color: "var(--success-text)", fontSize: 22 }} />
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              if your recipe is approved and published
            </p>
          </div>

          <div className="flex items-start gap-2">
            <CloseRoundedIcon sx={{ color: "var(--danger-text)", fontSize: 22 }} />
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              if your recipe is rejected, along with the reason and suggestions for improvement
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 w-full rounded-xl border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] py-4 text-base font-semibold text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] active:scale-[0.98]"
        >
          I understand
        </button>
      </motion.div>
    </motion.div>
  )
}
