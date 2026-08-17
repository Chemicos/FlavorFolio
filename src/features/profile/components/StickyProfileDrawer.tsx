import { motion } from "motion/react"

interface StickyProfileDrawerProps {
  width: number
  children: React.ReactNode
}

export default function StickyProfileDrawer({
  width,
  children,
}: StickyProfileDrawerProps) {
  return (
    <motion.div
      initial={{ opacity: 0}}
      animate={{ opacity: 1}}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="sticky top-20 self-start"
      style={{
        width,
        flexShrink: 0,
      }}
    >
      {children}
    </motion.div>
  )
}