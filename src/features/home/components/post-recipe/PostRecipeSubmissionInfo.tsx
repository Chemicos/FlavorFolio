import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded"
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"

import { motion } from "motion/react"

interface PostRecipeSubmissionInfoProps {
  onContinue: () => void
}

export default function PostRecipeSubmissionInfo({onContinue}: PostRecipeSubmissionInfoProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[120] flex items-center justify-center bg-[#050506]/55 px-5 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] rounded-2xl bg-[#202429] border border-white/[0.10] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
      >
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-[#0b0b0c]">
            <GppGoodRoundedIcon sx={{ fontSize: 45, color: "#a8b3cf" }} />
          </div>

          <div className="absolute bottom-1 left-[60px] flex h-7 w-7 items-center justify-center rounded-full bg-[#20232c]">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18, color: "#a8b3cf" }} />
          </div>
        </div>

        <h2 className="mt-8 text-[1.2rem] font-semibold leading-[2.35rem] text-white">
          Your recipe will be reviewed before publishing
        </h2>

        <p className="mt-4 text-sm leading-6 text-[#a8b3cf]">
          Before your recipe goes live, it will be reviewed by an administrator
          to make sure it meets our community and quality guidelines.
        </p>

        <h3 className="mt-7 text-[1rem] font-semibold text-white">
          You'll be notified in both cases:
        </h3>

        <div className="mt-5 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <CheckRoundedIcon sx={{ color: "#a7c957", fontSize: 22 }} />
            <p className="text-sm leading-7 text-[#a8b3cf]">
              if your recipe is approved and published
            </p>
          </div>

          <div className="flex items-start gap-2">
            <CloseRoundedIcon sx={{ color: "#d97757", fontSize: 22 }} />
            <p className="text-sm leading-6 text-[#a8b3cf]">
              if your recipe is rejected, along with the reason and suggestions
              for improvement
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 w-full rounded-xl bg-[#0b0b0c] py-4 text-base font-semibold text-white transition hover:bg-[#111214] active:scale-[0.98]"
        >
          I understand
        </button>
      </motion.div>
    </motion.div>
  )
}
