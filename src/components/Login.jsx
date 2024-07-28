import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { auth, provider } from "../firebase-config"
import googleIcon from '../assets/google-icon.webp'
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons"

export default function Login() {
  let navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/home")
    } catch (err) {
      setError(err.message)
      console.error(err)
    }
  }

  useEffect(() => {
    if (password === '') {
      setShowPassword(false)
    }
  })

  const togglePasswordVisibility = () => {
    if (password.length > 0) {
      setShowPassword(!showPassword)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home")
      } else {
        navigate("/")
      }
    })
    return () => unsubscribe()
  }, [navigate])
  
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider); 
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex bg-ff-bg flex-col items-center justify-center h-screen w-screen gap-5">
      <h1 className="font-medium text-4xl mb-6">
        Alătură-te 
        <span className="text-ff-flavor"> Flavor</span>
        <span className="text-ff-folio">Folio</span>
      </h1>

      <form className="flex flex-col w-80">
        <div className="flex flex-col mb-6">
              {error && 
                <p className="text-red-500 mb-4 bg-red-200 rounded-lg px-4 py-3 
                duration-500 ease-out opacity-0 animate-fadeIn">
                  {error}
                </p>
              }
              <label className="mb-2 font-semibold">Email</label>
              <input 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                className="bg-transparent border border-zinc-800 rounded-lg px-4 py-3
                placeholder:text-ff-googlebtn placeholder:opacity-50
                hover:shadow-input duration-150 focus:shadow-input" 
                type="email"
              />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-semibold" >Parolă</label>
            <div className="relative">
              <input
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }} 
                placeholder="6+ caractere" 
                className="bg-transparent w-80 border border-zinc-800 rounded-lg pl-4 pr-10 py-3
                placeholder:text-ff-googlebtn placeholder:opacity-50
                hover:shadow-input duration-150 focus:shadow-input" 
                type={showPassword ? 'text' : 'password'} 
              />

              <FontAwesomeIcon 
                className={
                  `absolute inset-y-0 right-0 my-auto mr-3
                  ${password ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`
                } 
                icon={showPassword ? faEyeSlash : faEye} 
                onClick={togglePasswordVisibility} 
              />
            </div>
          </div>

        <button 
        onClick={handleLogin}
        className="
          rounded-lg border border-ff-btn px-2 py-3 font-medium bg-ff-btn mt-8 
          hover:bg-ff-bg hover:border-ff-googlebtn duration-300">
          Loghează-te
        </button>
      </form>

      <div className="flex items-center gap-2">
          <span className="w-140 bg-ff-googlebtn h-1px"></span>
            SAU 
          <span className="w-140 bg-ff-googlebtn h-1px"></span>
      </div>

      <button 
        onClick={signInWithGoogle}
        className="bg-ff-googlebtn border border-ff-googlebtn rounded-lg w-80 justify-center gap-3 px-2
         py-3 flex items-center text-white font-medium
         hover:bg-ff-bg hover:text-ff-googlebtn duration-300" 
      >
        <img className="w-5 h-5" src={googleIcon} alt="google-icon" />
          Continuă cu Google
      </button>
      <p>Nu ai cont? <Link to="/register" className="text-ff-blue underline">Înregistrare</Link></p>
    </div>
  )
}
