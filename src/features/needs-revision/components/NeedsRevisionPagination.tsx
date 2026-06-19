import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded"
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

interface NeedsRevisionPaginationProps {
  rowsPerPage: number
  currentPage: number
  totalPages: number
  onRowsPerPageChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

const rowsPerPageOptions = [8, 12, 16, 24]

export default function NeedsRevisionPagination({
    rowsPerPage,
    currentPage,
    totalPages,
    onRowsPerPageChange,
    onPreviousPage,
    onNextPage,
}: NeedsRevisionPaginationProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [isRowsMenuOpen, setIsRowsMenuOpen] = useState(false)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsRowsMenuOpen(false)
        }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])
    return (
        <div className="shrink-0 border-t border-white/10 bg-[#16181d]/95 px-3 py-3 text-sm text-[#a8b3cf] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-end gap-4">
                <div className="flex items-center gap-8">
                <label className="flex items-center gap-2 text-white">
                    Rows per page

                    <div ref={dropdownRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setIsRowsMenuOpen((prev) => !prev)}
                        className="flex h-9 min-w-[74px] items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0b0b0c] px-3 text-sm text-white transition hover:border-white/20"
                    >
                        <span>{rowsPerPage}</span>

                        <motion.span
                            animate={{ rotate: isRowsMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center text-[#a8b3cf]"
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
                            className="absolute bottom-[calc(100%+8px)] right-0 z-50 w-[96px] overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
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
                                    ? "bg-orange-500/15 text-orange-200"
                                    : "text-[#a8b3cf] hover:bg-white/[0.04] hover:text-white",
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

                <p className="text-white">
                    Page {totalPages ? currentPage : 0} of {totalPages}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPreviousPage}
                        disabled={currentPage <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                        <KeyboardArrowLeftRoundedIcon />
                    </button>

                    <button
                        type="button"
                        onClick={onNextPage}
                        disabled={currentPage >= totalPages}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-white transition hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                        <KeyboardArrowRightRoundedIcon />
                    </button>
                </div>
                </div>
            </div>
        </div>
    )
}
