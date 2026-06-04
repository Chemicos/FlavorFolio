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
          <h3 className="text-md font-semibold text-white">Ingredients</h3>
          <p className="mt-1 text-xs text-[#7f89a6]">Add each ingredient with quantity and unit.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(true)
            setEditingIngredientId(null)
          }}
          disabled={isAdding}
          className="flex h-9 items-center gap-2 rounded-lg bg-[#0b0b0c] border border-white/10 px-3 text-sm font-medium text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white active:scale-95
          disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="group relative flex items-center justify-between gap-3 rounded-lg bg-[#0b0b0c] border border-white/10 px-3 py-3 transition hover:bg-[#0b0b0c]/70"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <p
                            className="shrink-0 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-sm text-[#a8b3cf]"
                          >
                            {item.quantity}

                            <span className="ml-1 text-[#a8b3cf]/60">
                              {item.unit}
                            </span>
                          </p>

                          <p className="truncate text-sm text-white">
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
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a8b3cf]/55 transition hover:bg-white/[0.04] hover:text-white"
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
                                className="absolute right-0 top-9 z-50 w-36 overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleStartEditIngredient(item)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#d7def0] transition hover:bg-[#16181d] hover:text-white"
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
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#db7668] transition hover:bg-[#db4633]/10 hover:text-[#ff8b7d]"
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
