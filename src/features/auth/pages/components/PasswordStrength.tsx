import { AnimatePresence, motion } from "motion/react"

interface PasswordStrengthProps {password: string}
interface PasswordCriterion {
  id: string
  text: string
  isValid: boolean
}

export const passwordCriteria = (password: string): PasswordCriterion[] => [
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
]

const strengthColors = [
  "var(--danger)",
  "var(--warning)",
  "var(--accent)",
  "var(--success)", 
]

function strengthColor(score: number) {
  if (score <= 0) return "var(--border-strong)"
  return strengthColors[Math.min(score - 1, strengthColors.length - 1)]
}

function getMessageColor(score: number) {
  if (score === 4) return "var(--success-text)"
  if (score >= 2) return "var(--warning-text)"
  return "var(--danger-text)"
}

const barWrap = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const criteria = passwordCriteria(password)
    const passed = criteria.filter((criterion) => criterion.isValid).length
    const nextCriterion = criteria.find((criterion) => !criterion.isValid)

    const message =
      password.length === 0
        ? "Use at least 8 characters with uppercase, numbers and special symbols."
        : nextCriterion
          ? nextCriterion.text
          : "Strong password"

    const activeColor = strengthColor(passed)
    const messageColor = getMessageColor(passed)

  return (
    <motion.div variants={barWrap} initial="hidden" animate="show" className="mt-2">
        <div className="flex gap-3">
        {criteria.map((criterion, index) => {
          const isActive = index < passed
          return (
            <motion.div
              key={criterion.id}
              className="h-[3px] flex-1 rounded-full transition-colors duration-200"
              initial={false}
              animate={{backgroundColor: isActive ? activeColor : "var(--border-strong)", opacity: isActive ? 1 : 0.65,}}
              transition={{duration: 0.20, ease: [0.16, 1, 0.3, 1]}}
              style={{backgroundColor: isActive ? activeColor : "var(--border-strong)", transformOrigin: "left",}}
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
            transition={{ duration: 0.20 }}
            style={{ color: messageColor }}
            className="text-xs transition-colors duration-200"
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
