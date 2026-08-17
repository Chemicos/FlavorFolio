import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"

interface ScrollToTopButtonProps {
  rightOffset?: number
}

export default function ScrollToTopButton({rightOffset = 24,}: ScrollToTopButtonProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 200)
        }

        window.addEventListener("scroll", handleScroll)
        handleScroll()

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

  return (
    <AnimatePresence>
        {isVisible && (
            <motion.div
                initial={{opacity: 0, y:10, filter: "blur(6px)"}}
                animate={{opacity: 1, y:0, filter: "blur(0px)"}}
                exit={{opacity: 0, y: 10, filter: "blur(6px)"}}
                transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1]
                }}
                className="fixed bottom-24 z-40"
                style={{right: rightOffset}}
            >
                <button
                    type="button"
                    onClick={handleScrollToTop}
                    aria-label="Scroll to top"
                    className={[
                        "group relative flex h-11 w-11 items-center justify-center rounded-full border",
                        "border-[var(--drawer-control-border)] bg-[var(--drawer-control-bg)]",
                        "text-[var(--text-secondary)] shadow-[var(--shadow-card)]",
                        "transition duration-200",
                        "hover:bg-[var(--drawer-control-hover)] hover:text-[var(--text-primary)]",
                        "active:scale-95",
                    ].join(" ")}
                >
                    <KeyboardArrowUpIcon sx={{fontSize: 24}} />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
  )
}
