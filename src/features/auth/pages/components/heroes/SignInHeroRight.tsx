import { motion } from "motion/react"
import PostAddIcon from '@mui/icons-material/PostAdd'
import BuildIcon from '@mui/icons-material/Build'
import FeedbackIcon from '@mui/icons-material/Feedback'

const fadeUp = (delay = 0) => ({
  initial: { y: 60, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -60, opacity: 0 },
  transition: { duration: 0.5, delay },
})

export default function SignInHeroRight() {
  return (
    <motion.div
        className="max-w-xl ml-auto"
    >
        <motion.h2 {...fadeUp(0.00)} className="text-6xl font-semibold tracking-tight">
            <span className="text-[#e17e00]">Cook</span>
            <span className="text-white/90">,</span>
            <br />
            <span className="bg-gradient-to-b from-white to-[#a8b3cf] bg-clip-text text-transparent">
              Share
            </span>
            <span className="text-white/90">,</span>
            <br />
            <span className="text-white/90">In</span>
            <span className="text-[#e17e00]">spire</span>
            <span className="text-white/90">.</span>
        </motion.h2>

        <motion.p
        {...fadeUp(0.15)}
        className="mt-6 text-white/70 text-xl leading-relaxed max-w-md"
      >
        Join the FlavorFolio&apos;s community and transform your recipes into a culinary portofolio.
      </motion.p>

      <motion.ul className="mt-10 space-y-4 text-white/70">
        <motion.li {...fadeUp(0.30)} className="flex items-center gap-3">
          <PostAddIcon sx={{ fontSize: 20, color: "rgba(168, 179, 207, 0.80)" }} />
          <span className="text-md">Post recipes</span>
        </motion.li>

        <motion.li {...fadeUp(0.45)} className="flex items-center gap-3">
          <BuildIcon sx={{ fontSize: 20, color: "rgba(168, 179, 207, 0.80)" }} />
          <span className="text-md">Build your community</span>
        </motion.li>

        <motion.li {...fadeUp(0.60)} className="flex items-center gap-3">
          <FeedbackIcon sx={{ fontSize: 20, color: "rgba(168, 179, 207, 0.80)" }} />
          <span className="text-md">Earn real feedback</span>
        </motion.li>
      </motion.ul>
    </motion.div>
  )
}
