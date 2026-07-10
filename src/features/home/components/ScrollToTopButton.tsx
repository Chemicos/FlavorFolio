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
                initial={{opacity: 0, y:10, filter: "blur(8px)"}}
                animate={{opacity: 1, y:0, filter: "blur(0px)"}}
                exit={{opacity: 0, y: 10, filter: "blur(8px)"}}
                transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                }}
                className="fixed bottom-24 right-6 z-40 2xl-plus:right-8"
                style={{right: rightOffset}}
            >
                <button
                    type="button"
                    onClick={handleScrollToTop}
                    aria-label="Scroll to top"
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#0b0b0c] backdrop-blur-xl
                    transition duration-200 hover:border-white/20 hover:bg-[#16181d] active:scale-95"
                >
                    <KeyboardArrowUpIcon
                        sx={{fontSize: 30}}
                        className="text-[#a8b3cf] transition duration-200 group-hover:text-white"     
                    />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
  )
}
