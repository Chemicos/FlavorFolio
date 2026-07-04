import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface Option {
  label: string
  value: string
}

interface AdminDashboardSelectProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
}

export default function AdminDashboardSelect({
  value,
  options,
  onChange,
}: AdminDashboardSelectProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(
    (option) => option.value === value
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
  }, [])

  return (
    <div ref={ref} className="relative z-20 min-w-[165px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-[38px] w-full items-center justify-between rounded-lg border border-white/10 bg-[#16181d] px-3 text-sm text-[#d7def0] transition hover:border-white/20 hover:bg-white/[0.03]"
      >
        <span>{selectedOption?.label}</span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.16 }}
          className="text-[#8f97b1]"
        >
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.96,
            }}
            transition={{
              duration: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute right-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-lg border border-white/10 bg-[#16181d] p-1 shadow-[0_20px_55px_rgba(0,0,0,0.55)]"
          >
            {options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition",
                    isSelected
                      ? "bg-[#feaa2b]/15 text-[#ffd28a]"
                      : "text-[#a8b3cf] hover:bg-white/[0.05] hover:text-white",
                  ].join(" ")}
                >
                  <span>{option.label}</span>

                  {isSelected && (
                    <CheckRoundedIcon sx={{ fontSize: 16 }} />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
