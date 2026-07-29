import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

type DropdownPlacement = "top" | "bottom"

interface SelectOption {
    label: string
    value: string
}

interface PostRecipeSelectProps {
    value: string
    options: SelectOption[]
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    placement?: DropdownPlacement
}

const fieldClass = [
  "w-full rounded-md border px-4 py-3 text-sm outline-none transition",
  "border-[var(--input-border)]",
  "bg-[var(--input-bg)]",
  "text-[var(--text-primary)]",
  "placeholder:text-[var(--input-placeholder)]",
  "hover:border-[var(--border-strong)]",
  "hover:bg-[var(--input-bg-hover)]",
  "focus:border-[var(--focus-border)]",
  "focus:ring-2",
  "focus:ring-[var(--focus-ring)]",
].join(" ")

export default function PostRecipeSelectDropdown({
    value,
    options,
    onChange,
    placeholder = "Select",
    disabled = false,
    placement = "bottom",
}: PostRecipeSelectProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    const selectedOption = options.find((option) => option.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

  return (
    <div className="relative z-50" ref={dropdownRef}>
        <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`${fieldClass} flex h-[46px] items-center justify-between`}
        >
            <span className={selectedOption ? "capitalize text-[var(--text-primary)]" : "text-[var(--input-placeholder)]"}>
                {selectedOption?.label || placeholder}
            </span>

            <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center text-[var(--text-secondary)]"
            >
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
            </motion.span>
        </button>

        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.96, }}
                    animate={{ opacity: 1, y: 0, scale: 1, }}
                    exit={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.96, }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1], }}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
                >
                    {options.map((option) => {
                        const isSelected = value === option.value

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                onChange(option.value)
                                setIsOpen(false)
                                }}
                                className={[
                                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                                isSelected
                                    ? "bg-[var(--dropdown-selected)] text-[var(--accent-text)]"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                <span>{option.label}</span>
                                {isSelected && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
                            </button>
                        )
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  )
}
