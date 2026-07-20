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

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
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
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-orange-400/20 bg-orange-500/10 px-3 text-sm font-semibold text-orange-200 transition hover:border-orange-300/30 hover:bg-orange-500/20 hover:text-orange-100 active:scale-[0.98] sm:px-4"
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
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[250px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("recipe")}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/[0.05]"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-200">
                <ArticleRoundedIcon sx={{ fontSize: 19 }} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-white">
                  Recipe
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-[#8f97b1]">
                  Publish a complete recipe with ingredients and cooking steps.
                </span>
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("reel")}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/[0.05]"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-200">
                <VideoLibraryRoundedIcon sx={{ fontSize: 19 }} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-white">
                  Reel (WIP)
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-[#8f97b1]">
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
