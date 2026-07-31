import AddRoundedIcon from "@mui/icons-material/AddRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"

import { useEffect, useRef, useState } from "react"
import { PostRecipeIngredient } from "../../types/postRecipe.types"
import { AnimatePresence, motion } from "motion/react"
import AddIngredientMiniForm from "./AddIngredientMiniForm"

interface PostRecipeIngredientsProps {
  ingredients: PostRecipeIngredient[]
  onChange: (ingredients: PostRecipeIngredient[]) => void
}

export default function PostRecipeIngredients({ingredients, onChange}: PostRecipeIngredientsProps) {
  const emptyDraft = {
    ingredient: "",
    quantity: "",
    unit: "g",
  }
  
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!openMenuId) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openMenuId])

  const handleAddIngredient = () => {
     onChange([
      ...ingredients,
      {
        id: crypto.randomUUID(),
        ingredient: draft.ingredient.trim(),
        quantity: draft.quantity.trim(),
        unit: draft.unit,
      },
    ])

    setDraft(emptyDraft)
    setIsAdding(false)
  }

  const handleStartEditIngredient = (item: PostRecipeIngredient) => {
    setEditingIngredientId(item.id)
    setDraft({
      ingredient: item.ingredient,
      quantity: item.quantity,
      unit: item.unit,
    })

    setIsAdding(false)
    setOpenMenuId(null)
  }

  const handleSaveEditIngredient = () => {
    if (!editingIngredientId) return

    onChange(
      ingredients.map((item) =>
        item.id === editingIngredientId
          ? {
              ...item,
              ingredient: draft.ingredient.trim(),
              quantity: draft.quantity.trim(),
              unit: draft.unit,
            }
          : item
      )
    )

    setDraft(emptyDraft)
    setEditingIngredientId(null)
  }

  const handleRemoveIngredient = (id: string) => {
    onChange(ingredients.filter((item) => item.id !== id))
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-md font-semibold text-[var(--text-primary)]">Ingredients</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Add each ingredient with quantity and unit.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(true)
            setEditingIngredientId(null)
          }}
          disabled={isAdding}
          className="flex h-9 items-center gap-2 rounded-lg bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)] px-3 text-sm font-medium text-[var(--button-secondary-text)] transition hover:bg-[var(--button-secondary-hover)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Add</span>
          <AddRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <AddIngredientMiniForm 
            value={draft}
            onChange={setDraft}
            onCancel={() => {
              setDraft(emptyDraft)
              setIsAdding(false)
            }}
            onConfirm={handleAddIngredient}
          />
        )}
      </AnimatePresence>

      {ingredients.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {ingredients.map((item) => {

              return (
                <motion.div
                  key={item.id}
                  layout
                  transition={{ layout: {
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                  }}}
                >
                  <AnimatePresence mode="wait">
                    {editingIngredientId === item.id ? (
                      <AddIngredientMiniForm 
                        value={draft}
                        onChange={setDraft}
                        onCancel={() => {
                          setDraft(emptyDraft)
                          setEditingIngredientId(null)
                        }}
                        onConfirm={handleSaveEditIngredient}
                      />
                    ) : (
                      <motion.div
                        key="view"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group relative flex items-center justify-between gap-3 rounded-lg bg-[var(--dropdown-bg)] border border-[var(--border)] px-3 py-3 transition hover:bg-[var(--dropdown-hover)]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <p
                            className="shrink-0 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
                          >
                            {item.quantity}

                            <span className="ml-1 text-[var(--text-muted)]">
                              {item.unit}
                            </span>
                          </p>

                          <p className="truncate text-sm text-[var(--text-primary)]">
                            {item.ingredient}
                          </p>
                        </div>

                        <div className="relative" ref={openMenuId === item.id ? menuRef : null}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === item.id ? null : item.id
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text-primary)]"
                          >
                            <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === item.id && (
                              <motion.div
                                initial={{opacity: 0, y: -6, scale: 0.96}}
                                animate={{opacity: 1, y: 0, scale: 1}}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute right-0 top-9 z-50 w-36 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleStartEditIngredient(item)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]"
                                >
                                  <EditRoundedIcon sx={{ fontSize: 17 }} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRemoveIngredient(item.id)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--danger-text)] transition hover:bg-[var(--danger-soft-hover)] hover:text-[var(--danger)]"
                                >
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
