import { signInWithPopup } from "firebase/auth"
import { auth, provider } from "../firebase-config"
import Cookies from "universal-cookie"
import googleIcon from '../assets/google-icon.webp'
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons"

const cookies = new Cookies()

export default function Login() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)

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


  let navigate = useNavigate()
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider); 
      cookies.set("auth-token", result.user.refreshToken); 
      navigate("/home")
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="font-medium text-4xl mb-6">
        Join 
        <span className="text-ff-flavor"> Flavor</span>
        <span className="text-ff-folio">Folio</span>
      </h1>

      <form className="flex flex-col w-80" action="">
        <div className="flex flex-col mb-6">
              <label className="mb-2 font-semibold">Username</label>
              <input 
                className=" bg-transparent border border-zinc-800 rounded-lg px-4 py-3
                placeholder:text-ff-googlebtn placeholder:opacity-50
                hover:shadow-input duration-150 focus:shadow-input" 
                type="text"
              />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-semibold" >Password</label>
            <div className="relative">
              <input
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6+ characters" 
                className="bg-transparent w-80 border border-zinc-800 rounded-lg px-4 py-3
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

        <button className="rounded-lg border border-ff-btn px-2 py-3 font-medium bg-ff-btn mt-8 
          hover:bg-ff-bg hover:border-ff-googlebtn duration-300">
          Login
        </button>
      </form>

      <div className="flex items-center gap-2">
          <span className="w-140 bg-ff-googlebtn h-1px"></span>
            OR 
          <span className="w-140 bg-ff-googlebtn h-1px"></span>
      </div>

      <button 
        onClick={signInWithGoogle}
        className="bg-ff-googlebtn border border-ff-googlebtn rounded-lg w-80 justify-center gap-3 px-2
         py-3 flex items-center text-white font-medium
         hover:bg-ff-bg hover:text-ff-googlebtn duration-300" 
      >
        <img className="w-5 h-5" src={googleIcon} alt="google-icon" />
          Continue with Google
      </button>
      <p>No account? <Link to="/register" className="text-ff-blue underline">Register</Link></p>
    </div>
  )
}
