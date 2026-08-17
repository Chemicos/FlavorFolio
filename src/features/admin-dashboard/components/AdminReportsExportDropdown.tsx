import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded"
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded"

import { useRef, useState } from "react"
import { AdminReportsPdfExportMode } from "../services/adminReportsPdf.service"
import { AnimatePresence, motion } from "motion/react"
import { useDismissibleLayer } from "../../../hooks/useDismissibleLayer"

interface AdminReportsExportDropdownProps {
    onExport: (mode: AdminReportsPdfExportMode) => void
}

export default function AdminReportsExportDropdown({onExport}: AdminReportsExportDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useDismissibleLayer({
      isOpen,
      refs: [dropdownRef],
      onDismiss: () => setIsOpen(false),
    })

    const handleExport = (mode: AdminReportsPdfExportMode) => {
        onExport(mode)
        setIsOpen(false)
    }
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 text-sm font-semibold text-[var(--accent-text)] transition hover:bg-[var(--accent-soft-hover)] active:scale-[0.98]"
      >
        <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
        Export Report

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.16 }}
          className="flex items-center"
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
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[230px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--account-dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
          >
            <button
              type="button"
              onClick={() => handleExport("current")}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[var(--dropdown-hover)]"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <ArticleRoundedIcon sx={{ fontSize: 18 }} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  Export current tab
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">
                  PDF for the selected report section.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleExport("full")}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[var(--dropdown-hover)]"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <DashboardCustomizeRoundedIcon sx={{ fontSize: 18 }} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  Export full report
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">
                  PDF with all report tabs included.
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
