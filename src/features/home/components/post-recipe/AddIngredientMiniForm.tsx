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
const fieldClass = "w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"

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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
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
                ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-soft)]"
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
                className="pointer-events-none absolute left-0 -top-12 z-50 rounded-lg border border-[var(--danger-border)] bg-[var(--button-danger-bg)] px-3 py-2 text-xs text-[var(--button-danger-text)] shadow-[var(--shadow-card)]"
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
                className="flex items-center text-[var(--text-secondary)]"
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
                  className="absolute bottom-full left-0 right-0 z-[80] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
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
                            ? "bg-[var(--dropdown-selected)] text-[var(--accent-text)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]",
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
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--button-danger-bg)] border border-[var(--button-danger-border)] text-[var(--button-danger-text)] transition hover:bg-[var(--button-danger-hover)] active:scale-95"
          >
            <CloseRoundedIcon sx={{ fontSize: 19 }} />
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--button-success-border)] bg-[var(--button-success-bg)] text-[var(--button-success-text)] transition hover:bg-[var(--button-success-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
