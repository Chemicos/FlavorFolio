import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

interface AddIngredientMiniFormValue {
  ingredient: string
  quantity: string
  unit: string
}

interface AddIngredientMiniFormProps {
  value: AddIngredientMiniFormValue
  onChange: (value: AddIngredientMiniFormValue) => void
  onCancel: () => void
  onConfirm: () => void
}

const units = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece"]
const fieldClass = "w-full rounded-lg border border-white/10 bg-[#0b0b0c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"

export default function AddIngredientMiniForm({
    value,
    onChange,
    onCancel,
    onConfirm
}: AddIngredientMiniFormProps) {
    const unitDropdownRef = useRef<HTMLDivElement | null>(null)
    const [isUnitOpen, setIsUnitOpen] = useState(false)

    const ingredientRegex = /^[a-zA-Z\s-]+$/
    const quantityRegex = /^\d*\.?\d*$/

    const isIngredientInvalid =
        Boolean(value.ingredient.trim()) &&
        !ingredientRegex.test(value.ingredient.trim())

    const isQuantityInvalid =
        Boolean(value.quantity.trim()) &&
        !quantityRegex.test(value.quantity.trim())       
    
     const canConfirm =
        Boolean(value.ingredient.trim()) &&
        Boolean(value.quantity.trim()) &&
        !isIngredientInvalid &&
        !isQuantityInvalid

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (
            unitDropdownRef.current &&
            !unitDropdownRef.current.contains(event.target as Node)
        ) {
            setIsUnitOpen(false)
        }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])
  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: -6 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-visible"
    >
      <div className="rounded-xl border border-white/10 bg-[#0b0b0c]/70 p-3">
        <div className="relative">
          <input
            value={value.ingredient}
            onChange={(event) =>
              onChange({ ...value, ingredient: event.target.value })
            }
            placeholder="Ingredient name"
            className={[
              fieldClass,
              isIngredientInvalid
                ? "border-red-400/60 focus:border-red-400/70 focus:ring-red-500/10"
                : "",
            ].join(" ")}
          />

          <AnimatePresence>
            {isIngredientInvalid && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute left-0 -top-12 z-50 rounded-lg border border-red-400/20 bg-[#140b0b] px-3 py-2 text-xs text-red-200 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
              >
                Ingredient name can contain only letters, spaces and hyphens.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_110px_auto_auto] gap-2">
          <input
            value={value.quantity}
            onChange={(event) => {
              const nextValue = event.target.value

              if (nextValue === "" || quantityRegex.test(nextValue)) {
                onChange({ ...value, quantity: nextValue })
              }
            }}
            placeholder="Quantity"
            inputMode="decimal"
            className={fieldClass}
          />

          <div className="relative z-50" ref={unitDropdownRef}>
            <button
              type="button"
              onClick={() => setIsUnitOpen((prev) => !prev)}
              className={`${fieldClass} flex h-11 items-center justify-between`}
            >
              <span>{value.unit}</span>

              <motion.span
                animate={{ rotate: isUnitOpen ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center text-[#a8b3cf]"
              >
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
              </motion.span>
            </button>

            <AnimatePresence>
              {isUnitOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-full left-0 right-0 z-[80] overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                >
                  {units.map((unitOption) => {
                    const isSelected = value.unit === unitOption

                    return (
                      <button
                        key={unitOption}
                        type="button"
                        onClick={() => {
                          onChange({ ...value, unit: unitOption })
                          setIsUnitOpen(false)
                        }}
                        className={[
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                          isSelected
                            ? "bg-orange-500/15 text-orange-200"
                            : "text-[#a8b3cf] hover:bg-white/[0.04] hover:text-white",
                        ].join(" ")}
                      >
                        {unitOption}
                        {isSelected && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 transition hover:bg-red-500/20 active:scale-95"
          >
            <CloseRoundedIcon sx={{ fontSize: 19 }} />
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 text-green-300 transition hover:bg-green-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
