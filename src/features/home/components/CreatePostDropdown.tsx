import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded"
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded"

import { useEffect, useRef, useState } from "react"
import { CreatePostType } from "../pages/Home"
import { AnimatePresence, motion } from "motion/react"

interface CreatePostDropdownProps {
  onSelect: (postType: CreatePostType) => void
}

export default function CreatePostDropdown({onSelect}: CreatePostDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        function handleViewportChange() {
            setIsOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)
        window.addEventListener("scroll", handleViewportChange, { passive: true })
        window.addEventListener("resize", handleViewportChange)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
            window.removeEventListener("scroll", handleViewportChange)
            window.removeEventListener("resize", handleViewportChange)
        }
    }, [])

    function handleSelect(postType: CreatePostType) {
        onSelect(postType)
        setIsOpen(false)
    }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={[
          "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition active:scale-[0.98] sm:px-4",
          isOpen
            ? "border-[var(--accent-border)] bg-[var(--accent-soft-hover)] text-[var(--accent-text)]"
            : "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] hover:bg-[var(--accent-soft-hover)]",
        ].join(" ")}
      >
        <PostAddRoundedIcon sx={{ fontSize: 20 }} />

        <span className="hidden sm:inline">New post</span>

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
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{
              duration: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute right-0 top-[calc(100%+10px)] z-40 w-[250px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--account-dropdown-bg)] p-1 shadow-[var(--shadow-dropdown)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("recipe")}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[var(--dropdown-hover)]"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <ArticleRoundedIcon sx={{ fontSize: 19 }} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  Recipe
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">
                  Publish a complete recipe with ingredients and cooking steps.
                </span>
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("reel")}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[var(--dropdown-hover)]"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <VideoLibraryRoundedIcon sx={{ fontSize: 19 }} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  Reel (WIP)
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">
                  Share a short vertical cooking video with the community.
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
