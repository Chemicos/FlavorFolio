import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded"
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

interface RecipeReviewPaginationProps {
  totalCount: number
  rowsPerPage: number
  currentPage: number
  totalPages: number
  onRowsPerPageChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

const rowsPerPageOptions = [12, 16, 24]

export default function RecipeReviewPagination({
  rowsPerPage,
  currentPage,
  totalPages,
  onRowsPerPageChange,
  onPreviousPage,
  onNextPage,
}: RecipeReviewPaginationProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [isRowsMenuOpen, setIsRowsMenuOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsRowsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div
      className={[
        "shrink-0 border-t border-[var(--border)]",
        "bg-[var(--bg-primary)] px-3 py-3",
        "text-sm text-[var(--text-secondary)]",
        "transition-colors",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2 text-[var(--text-primary)]">
            Rows per page

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsRowsMenuOpen((prev) => !prev)}
                className={[
                  "flex h-9 min-w-[74px] items-center justify-between gap-2",
                  "rounded-lg border px-3 text-sm font-medium transition",
                    isRowsMenuOpen
                      ? [
                          "border-[var(--focus-border)]",
                          "bg-[var(--input-bg-hover)]",
                          "text-[var(--text-primary)]",
                          "ring-2 ring-[var(--focus-ring)]",
                      ].join(" ")
                      : [
                          "border-[var(--input-border)]",
                          "bg-[var(--input-bg)]",
                          "text-[var(--text-primary)]",
                          "hover:border-[var(--border-strong)]",
                          "hover:bg-[var(--input-bg-hover)]",
                      ].join(" "),
                ].join(" ")}
              >
                <span>{rowsPerPage}</span>

                <motion.span
                  animate={{ rotate: isRowsMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center text-[var(--text-secondary)]"
                >
                  <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
                </motion.span>
              </button>

              <AnimatePresence>
                {isRowsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className={[
                        "absolute bottom-[calc(100%+8px)] right-0 z-50",
                        "w-[104px] overflow-hidden rounded-lg border",
                        "border-[var(--border)] bg-[var(--account-dropdown-bg)]",
                        "p-1 shadow-[var(--shadow-dropdown)]",
                    ].join(" ")}
                  >
                    {rowsPerPageOptions.map((option) => {
                      const isSelected = option === rowsPerPage

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            onRowsPerPageChange(option)
                            setIsRowsMenuOpen(false)
                          }}
                          className={[
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                              isSelected
                                ? [
                                    "bg-[var(--dropdown-selected)]",
                                    "font-semibold text-[var(--accent-text)]",
                                  ].join(" ")
                                : [
                                    "text-[var(--text-secondary)]",
                                    "hover:bg-[var(--dropdown-hover)]",
                                    "hover:text-[var(--text-primary)]",
                                  ].join(" "),
                          ].join(" ")}
                        >
                          <span>{option}</span>
                          {isSelected && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </label>

          <p className="text-[var(--text-primary)]">
            Page {totalPages ? currentPage : 0} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-lg border",
                "border-[var(--button-secondary-border)]",
                "bg-[var(--button-secondary-bg)]",
                "text-[var(--button-secondary-text)]",
                "transition active:scale-95",
                "hover:bg-[var(--button-secondary-hover)]",
                "hover:text-[var(--text-primary)]",
                "disabled:cursor-not-allowed disabled:opacity-40",
              ].join(" ")}
            >
              <KeyboardArrowLeftRoundedIcon />
            </button>

            <button
              type="button"
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              className={[
                  "flex h-9 w-9 items-center justify-center rounded-lg border",
                  "border-[var(--accent-border)]",
                  "bg-[var(--accent-soft)]",
                  "text-[var(--accent-text)]",
                  "transition active:scale-95",
                  "hover:bg-[var(--accent-soft-hover)]",
                  "disabled:cursor-not-allowed disabled:opacity-40",
              ].join(" ")}
            >
              <KeyboardArrowRightRoundedIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
