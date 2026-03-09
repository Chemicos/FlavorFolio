import { AnimatePresence, motion } from "motion/react"

const passwordCriteria = (password) => ([
    {
        id: 'minLength',
        text: 'Use at least 8 characters',
        isValid: password.length >= 8,
    },
    {
        id: 'upperCase',
        text: 'Add at least 1 uppercase letter',
        isValid: /[A-Z]/.test(password)
    },
    {
        id: 'number',
        text: 'Add at least 1 number',
        isValid: /[0-9]/.test(password)
    },
    {
        id: 'specialChar',
        text: 'Add a special character (!@#$...)',
        isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
])

const strengthColors = [
  "rgba(239,68,68,0.95)",   
  "rgba(249,115,22,0.95)",  
  "rgba(234,179,8,0.95)",   
  "rgba(34,197,94,0.95)",   
]

function strengthColor(score) {
  if (score <= 0) return "rgba(168,179,207,0.20)"
  return strengthColors[Math.min(score - 1, strengthColors.length - 1)]
}

const barWrap = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function PasswordStrength({ password }) {
    const criteria = passwordCriteria(password)
    const passed = criteria.filter((c) => c.isValid).length

    const next = criteria.find((c) => !c.isValid)
    const message =
    password.length === 0
      ? "Use at least 8 characters with uppercase, numbers and special symbols."
      : next
        ? next.text
        : "Strong password"

    const activeColor = strengthColor(passed)

  return (
    <motion.div variants={barWrap} initial="hidden" animate="show" className="mt-2">
        <div className="flex gap-3">
        {criteria.map((c, idx) => {
          const isOn = idx < passed
          return (
            <motion.div
              key={c.id}
              className="h-[3px] flex-1 rounded-full"
              initial={false}
              animate={{
                backgroundColor: isOn ? activeColor : "rgba(168,179,207,0.18)",
                opacity: isOn ? 1 : 0.65,
              }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1]
              }}
            />
          )
        })}
      </div>

      <div className="mt-2 px-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ y: 6, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -6, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.22 }}
            className={[
              "text-xs",
              passed === 4 ? "text-green-400/90" : "text-red-400/80",
            ].join(" ")}
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
