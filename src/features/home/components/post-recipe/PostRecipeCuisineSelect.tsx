import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

interface PostRecipeCuisineSelectProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
}

const fieldClass = "w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] hover:bg-[var(--input-bg-hover)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"

export default function PostRecipeCuisineSelect({
    value,
    options,
    onChange,
    placeholder = "Cuisine"
}: PostRecipeCuisineSelectProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    
    const filteredOptions = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        if (!normalizedSearch) return options

        return options.filter((option) =>
        option.toLowerCase().includes(normalizedSearch)
        )
    }, [options, search])

   useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [])

  return (
    <div ref={dropdownRef} className="relative z-[80]">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev)
          setSearch("")
        }}
        className={`${fieldClass} flex h-[46px] items-center justify-between`}
      >
        <span className={value ? "capitalize text-[var(--text-primary)]" : "text-[var(--input-placeholder)]"}>
          {value || placeholder}
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
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] p-2 shadow-[var(--shadow-dropdown)]"
          >
            <div className="relative mb-2">
              <SearchRoundedIcon
                sx={{ fontSize: 18 }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--input-placeholder)]"
              />

              <input
                value={search}
                autoFocus
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--input-placeholder)] hover:border-[var(--border-strong)] focus:border-[var(--focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]">
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const isSelected = value === option

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        onChange(option)
                        setIsOpen(false)
                        setSearch("")
                      }}
                      className={[
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-[var(--dropdown-selected)] text-[var(--accent-text)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--dropdown-hover)] hover:text-[var(--text-primary)]",
                      ].join(" ")}
                    >
                      <span>{option}</span>
                      {isSelected && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
                    </button>
                  )
                })
              ) : (
                <p className="px-3 py-3 text-sm text-[var(--text-muted)] italic">
                  No cuisine found.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
