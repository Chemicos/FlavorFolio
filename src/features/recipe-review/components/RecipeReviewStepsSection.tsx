import { AnimatePresence, motion } from "motion/react"
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"

interface RecipeReviewStep {
  title?: string
  description?: string
  imageUrl?: string
}

interface RecipeReviewStepsSectionProps {
  steps: RecipeReviewStep[]
  expandedSteps: Record<number, boolean>
  onToggleStep: (index: number) => void
}

export default function RecipeReviewStepsSection({
    steps,
    expandedSteps,
    onToggleStep
}: RecipeReviewStepsSectionProps) {
  return (
    <div className="mt-4">
      <div className="mt-5 flex flex-col gap-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isExpanded = Boolean(expandedSteps[stepNumber])

          return (
            <div
              key={stepNumber}
              className={[
                "overflow-hidden rounded-lg border transition",
                isExpanded
                  ? "border-[var(--border-strong)] bg-[var(--card-bg)]"
                  : "border-transparent bg-[var(--surface-subtle)]",
                "hover:border-[var(--border)] hover:bg-[var(--card-hover)]",
                "active:bg-[var(--surface-active)]",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onToggleStep(stepNumber)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="min-w-0">
                  <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-text)]">
                    Step {stepNumber}
                  </span>

                  {step?.title?.trim() && (
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">
                      - {step.title}
                    </span>
                  )}
                </div>

                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="shrink-0 text-[var(--text-secondary)]"
                >
                  <ExpandMoreRoundedIcon />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="mx-5 h-px" 
                      style={{
                        background: "linear-gradient(to right, transparent, var(--border), transparent)",
                      }}
                    />

                    <div className="px-5 pb-5">
                      {step?.imageUrl && (
                        <div className="my-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
                          <img
                            src={step.imageUrl}
                            alt={`Step ${stepNumber}`}
                            className="h-[210px] w-full object-cover"
                          />
                        </div>
                      )}

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
                        {step?.description || "No description available."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
