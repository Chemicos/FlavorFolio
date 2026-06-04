import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"

import { PostRecipeStep, PostRecipeStepDraft } from "../../types/postRecipe.types"
import { AnimatePresence, motion } from "motion/react"
import AddStepMiniForm from "./AddStepMiniForm"
import { useEffect, useRef, useState } from "react"

interface PostRecipeStepsProps {
  steps: PostRecipeStep[]
  onChange: (steps: PostRecipeStep[]) => void
}

const emptyDraft: PostRecipeStepDraft = {
  title: "",
  description: "",
  image: null,
  imagePreview: "",
}

export default function PostRecipeSteps({
  steps,
  onChange
}: PostRecipeStepsProps) {
  const [isAdding, setIsAdding] = useState(false)

  const [draft, setDraft] = useState<PostRecipeStepDraft>(emptyDraft)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!openMenuId) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return

      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openMenuId])

  const resetDraft = () => {
    setDraft(emptyDraft)
    setIsAdding(false)
    setEditingStepId(null)
  }

  const handleAddStep = () => {
    if (!draft.description.trim()) return

    onChange([
      ...steps,
      {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        image: draft.image || null,
        imagePreview: draft.imagePreview || "",
      }
    ])

    resetDraft()
  }

  const handleStartEditStep = (step: PostRecipeStep) => {
    setEditingStepId(step.id)
    setDraft({
      title: step.title || "",
      description: step.description || "",
      image: step.image || null,
      imagePreview: step.imagePreview || "",
    })

    setIsAdding(false)
    setOpenMenuId(null)
  }

  const handleSaveEditStep = () => {
    if (!editingStepId || !draft.description.trim()) return

    onChange(
      steps.map((step) =>
        step.id === editingStepId
          ? {
              ...step,
              title: draft.title.trim(),
              description: draft.description.trim(),
              image: draft.image || null,
              imagePreview: draft.imagePreview || "",
            }
          : step
      )
    )

    resetDraft()
  }

  const handleRemoveStep = (id: string) => {
    onChange(steps.filter((step) => step.id !== id))

    if (editingStepId === id) {
      resetDraft()
    }

    if (openMenuId === id) {
      setOpenMenuId(null)
    }
  }
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Steps</h3>
          <p className="mt-1 text-xs text-[#7f89a6]">Describe each cooking step clearly.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(true)
            setEditingStepId(null)
            setDraft(emptyDraft)
          }}
          disabled={isAdding}
          className="flex h-9 items-center gap-2 rounded-lg bg-[#0b0b0c] border border-white/10 px-3 text-sm font-medium text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Add</span>
          <AddRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (          
          <AddStepMiniForm 
            value={draft}
            onChange={setDraft}
            onCancel={resetDraft}
            onConfirm={handleAddStep}
          />
        )}
      </AnimatePresence>

      {steps.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                layout
                transition={{
                  layout: {
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
              >
                <AnimatePresence mode="wait">
                  {editingStepId === step.id ? (
                    <AddStepMiniForm
                      key="edit"
                      value={draft}
                      onChange={setDraft}
                      onCancel={resetDraft}
                      onConfirm={handleSaveEditStep}
                    />
                  ) : (
                    <motion.div
                      key="view"
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group relative rounded-xl border border-white/10 bg-[#0b0b0c] p-4 transition hover:bg-[#0b0b0c]/70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-sm font-bold text-white">
                          {index + 1}
                        </div>

                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                          {step.title || `Step ${index + 1}`}
                        </p>

                        <div className="relative" ref={openMenuId === step.id ? menuRef : null}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === step.id ? null : step.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a8b3cf]/55 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            <MoreHorizRoundedIcon sx={{ fontSize: 19 }} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === step.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute right-0 bottom-full z-50 w-36 overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleStartEditStep(step)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#d7def0] transition hover:bg-[#16181d] hover:text-white"
                                >
                                  <EditRoundedIcon sx={{ fontSize: 17 }} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(step.id)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d]"
                                >
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-4">
                        <p className="min-w-0 flex-1 line-clamp-4 text-sm leading-6 text-[#a8b3cf]">
                          {step.description}
                        </p>

                        {step.imagePreview && (
                          <img
                            src={step.imagePreview}
                            alt={step.title || `Step ${index + 1}`}
                            className="h-20 w-24 shrink-0 rounded-xl object-cover"
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
