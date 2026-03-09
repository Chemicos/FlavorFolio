import logo from "../../../../assets/FF_logo.png"
import { motion } from "motion/react"
import SignInForm from './SignInForm.js'
import SignUpForm from './SignUpForm.js'

type AuthCardProps = {
    mode?: "signin" | "signup"
    onModeChange?: (mode: "signin" | "signup") => void
}

export default function AuthCard({mode = "signin", onModeChange}: AuthCardProps) {
    const isSignIn = mode === 'signin'

  return (
    <div className="flex flex-col w-full max-w-[460px] rounded-lg bg-[#0b0b0c]/40 p-8 lg:px-10">
        <div className="flex flex-col items-start gap-8">
        <div className="flex flex-col items-center mx-auto gap-1">
            <img src={logo} alt="FlavorFolio" className="h-8 w-8" />
            <div className="text-md font-semibold">
            <span className="text-white">Flavor</span>
            <span className="text-[#e17e00]">Folio</span>
            </div>
        </div>

        <div className="flex flex-col mx-auto items-center gap-2">
            <h1 className="text-[25px] leading-tight text-white">
                {isSignIn ? "Sign in" : "Sign up"}
            </h1>
            <p className="text-[#5c616f] text-sm">
                {isSignIn ? "Access your account" : "Become part of this community"}
            </p>
        </div>
        </div>

        {isSignIn ? <SignInForm /> : <SignUpForm />}

        <div className="w-full rounded-full border border-[#3f424a] bg-[#0b0b0c] p-2 flex items-center gap-1 mt-14 relative"
        role="tablist"
        aria-label="Authentication switch"
        >
            <motion.div
                className="absolute top-2 bottom-2 left-2 w-[calc(50%-8px)] rounded-full bg-orange-600/80"
                animate={{ x: isSignIn ? 0 : "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />

            <button
                type="button"
                role="tab"
                aria-selected={isSignIn}
                onClick={() => onModeChange?.("signin")}
                className={[
                "relative z-10 flex-1 text-center py-2 rounded-full transition-colors",
                isSignIn ? "text-white" : "text-[#a8b3cf]/50 hover:text-white",
                ].join(" ")}
            >
                Sign In
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={!isSignIn}
                onClick={() => onModeChange?.("signup")}
                className={[
                "relative z-10 flex-1 text-center py-2 rounded-full transition-colors",
                !isSignIn ? "text-white" : "text-[#a8b3cf]/50 hover:text-white",
                ].join(" ")}
            >
                Sign Up
            </button>
        </div>
    </div>
  )
}
