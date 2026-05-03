import { AnimatePresence, motion } from "motion/react"

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"

interface Step {
  title?: string
  description?: string
  imageUrl?: string
}

interface ViewRecipeStepsSectionProps {
  steps: Step[]
  expandedSteps: Record<number, boolean>
  areAllStepsExpanded: boolean
  onToggleStep: (index: number) => void
  onToggleAllSteps: () => void
}

export default function ViewRecipeStepsSection({
  steps,
  expandedSteps,
  areAllStepsExpanded,
  onToggleStep,
  onToggleAllSteps
}: ViewRecipeStepsSectionProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
          <h2 className="text-[1.2rem] font-bold text-white">Steps</h2>

          {steps.length > 1 && (
              <button 
                  type="button" 
                  onClick={onToggleAllSteps} 
                  className={[
                      "rounded-md px-4 py-2 text-sm text-[#a8b3cf]/60 transition hover:bg-[#0b0b0c] hover:text-white active:scale-95",
                      areAllStepsExpanded ? "bg-[#0b0b0c] text-white" : ""
                  ].join(" ")}
              >
                  {areAllStepsExpanded ? "Collapse all" : "Expand all"}
              </button>
          )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
          {steps.map((step, index) => {
              const stepNumber = index + 1
              const isExpanded = Boolean(expandedSteps[stepNumber])

              return (
                  <div key={stepNumber} className={[
                      "overflow-hidden rounded-lg hover:bg-[#0b0b0c] active:bg-white/[0.04] transition",
                      isExpanded ? "bg-[#0b0b0c] border border-[#a8b3cf]/20" : "bg-[#0b0b0c]/40"
                  ].join(" ")}>
                      <button
                          type="button"
                          onClick={() => onToggleStep(stepNumber)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left"
                      >
                          <span className="text-sm font-semibold text-white">
                              Step {stepNumber}
                          </span>

                          <span className="ml-2 font-sm text-[#9ba6c6]">
                              {step?.title?.trim() ? ` - ${step.title}` : ""}
                          </span>

                          <motion.span
                              animate={{rotate: isExpanded ? 180 : 0}}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
                              className="text-[#b8c2df]"
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
                                  <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                  <div className="px-5 pb-5">
                                  {step?.imageUrl && (
                                      <div className="mb-4 overflow-hidden rounded-2xl bg-white/10">
                                      <img
                                          src={step.imageUrl}
                                          alt={`Step ${stepNumber}`}
                                          className="h-[210px] w-full object-cover"
                                      />
                                      </div>
                                  )}

                                  <p className="text-[0.98rem] leading-7 text-white">
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
