import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../../firebase-config.js"
import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

import bg from "../../../assets/darkGradientBackground.jpg"

import SignInHeroRight from "./components/heroes/SignInHeroRight.js"
import AuthCard from "./components/AuthCard.js"
import SignUpHeroRight from "./components/heroes/SignUpHeroRight.js"

export default function Login() {
  // const navigate = useNavigate()
  const location = useLocation()

  const initialMode = location.pathname.includes("register") ? "signup" : "signin"
  const [mode, setMode] = useState(initialMode)
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user && location.pathname === "/") {
  //       navigate("/home")
  //     }
  //   })
  //   return () => unsubscribe()
  // }, [navigate, location.pathname])

  return (
    <div className="min-h-screen w-screen relative overflow-hidden">
      <img
        src={bg}
        alt="background"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#0b0b0c]/45" />

      <div className="relative z-10 min-h-screen w-full px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="flex justify-center">
            <AuthCard mode={mode} onModeChange={setMode} />
          </div>

          <div className="hidden lg:block">
            {mode === "signin" ? <SignInHeroRight /> : <SignUpHeroRight />}
          </div>

        </div>
      </div>
    </div>
  )
}
