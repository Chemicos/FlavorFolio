import { motion, useAnimationControls } from "motion/react"
import type { TargetAndTransition, Variants } from "motion/react"

import recipeCard1 from "../../../assets/RecipeCard1.png"
import recipeCard2 from "../../../assets/RecipeCard2.png"
import recipeCard3 from "../../../assets/RecipeCard3.png"
import { useEffect, type CSSProperties } from "react"

type FloatingCardProps = {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  amp?: number
  duration?: number
  delay?: number
  index?: number
}

const container: Variants = {
    hidden: {opacity: 0},
    show: {
        opacity: 1,
        transition: {staggerChildren: 0.08, delayChildren: 0.15}
    }
}
const item: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 0.3, 0.3, 3] },
  },
}

const cardIntro: Variants = {
  hidden: { opacity: 0, y: 50, filter: "blur(14px)", scale: 0.985 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 0.55,
      delay: 0.25 + i * 0.08, 
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

const floatKeyframes = (
  amp = 12,
  duration = 4.5,
  delay = 0
): TargetAndTransition => ({
  y: [0, -amp, 0],
  transition: {
    duration,
    repeat: Infinity,
    repeatType: "mirror",
    ease: "easeInOut",
    delay,
  },
})

function FloatingCard({
  src,
  alt,
  className,
  style,
  amp,
  duration,
  delay,
  index = 0,
} : FloatingCardProps) { 
  const controls = useAnimationControls()

  useEffect(() => {
    let mounted = true

    async function run() {
      await controls.start("show")
      if (!mounted) return
      controls.start(floatKeyframes(amp, duration, delay))
    }

    run()
    return () => {
      mounted = false
    }
  }, [controls, amp, duration, delay])

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      style={style}
      variants={cardIntro}
      custom={index}
      initial="hidden"
      animate={controls}
    />
  )
}

export default function SignUpHeroRight() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl ml-auto">
        <motion.h2 variants={item} className="text-6xl font-semibold tracking-tight leading-[0.95]">
            <span className="text-[#e17e00]">Join</span>
            <br />
            <span className="bg-gradient-to-b from-white to-[#a8b3cf] bg-clip-text text-transparent">the</span>
            <br />
            <span className="text-[#e17e00]">culinary</span>
            <br />
            <span className="bg-gradient-to-b from-[#f0b24a] via-[#d79a37] to-[#ffd493] bg-clip-text text-transparent">
              creators
            </span>
        </motion.h2>

        <motion.p variants={item} className="mt-6 text-white/80 text-xl leading-relaxed max-w-md">
            Thousands of passionates transform their recipes into a visual portofolio
        </motion.p>

       <motion.div
            className="mt-16 relative w-full"
            style={{ height: 320 }}
        >
        <FloatingCard
          src={recipeCard1}
          alt="recipe card"
          className="absolute w-[380px]"
          style={{ left: 0, top: -30 }}
          amp={12}
          duration={4.8}
          delay={0.1}
          index={0}
        />

        <FloatingCard
          src={recipeCard2}
          alt="recipe card"
          className="absolute w-[340px] max-[1500px]:hidden"
          style={{ left: 400, top: -60 }}
          amp={10}
          duration={4.2}
          delay={0.25}
          index={1}
        />

        <FloatingCard
          src={recipeCard3}
          alt="recipe card"
          className="absolute w-[220px] max-[1700px]:hidden"
          style={{ left: 560, top: -380 }}
          amp={14}
          duration={5.1}
          delay={0.35}
          index={2}
        />
      </motion.div>
    </motion.div>
  )
}
