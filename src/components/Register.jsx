import { signInWithPopup } from "firebase/auth"
import { auth, provider } from "../firebase-config"
import Cookies from "universal-cookie"
import googleIcon from '../assets/google-icon.webp'
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons"
import { faCheck } from "@fortawesome/free-solid-svg-icons"

const cookies = new Cookies()

export default function Register() {
  const [email, setEmail] = useState('')
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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
  // Password functionality -->
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  useEffect(() => {
    if (password === '') {
      setShowPassword(false)
    }
  }, [password])
  
  const togglePasswordVisibility = () => {
    if (password.length > 0) {
      setShowPassword(!showPassword)
    }
  }
  
  const handleChangePassword = (e) => {
    setPassword(e.target.value)
  }
  // Password functionality <--

  // Password criteria -->
  const passwordCriteria = [
    { 
      id: 'minLength', 
      text: 'At least 6 characters', 
      isValid: password.length >= 6 
    },
    { 
      id: 'specialChar', 
      text: 'At least one special character (!@#$%^&*().)', 
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
    },
    { 
      id: 'upperCase',
      text: 'At least one uppercase character',
      isValid: /[A-Z]/.test(password) },
      { 
        id: 'number', 
        text: 'At least one number', 
        isValid: /[0-9]/.test(password) 
      }
    ]
    
    const validCriteriaCount = Object.values({
      minLength: password.length >= 6,
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      number: /[0-9]/.test(password),
      upperCase: /[A-Z]/.test(password),
    }).filter(isValid => isValid).length
    
    const progressBarColor = (() => {
      switch(validCriteriaCount) {
        case 1: return 'bg-red-600'
        case 2: return 'bg-orange-600'
        case 3: return 'bg-amber-500'
        case 4: return 'bg-emerald-500'
        default: return 'bg-transparent'
      }
    })()
    const progressPercentage = (validCriteriaCount / 4) * 100
    // Password criteria <--
    
    // Confirm Password Functionality -->
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    useEffect(() => {
      if(confirmPassword === '') {
        setShowConfirmPassword(false)
      }
    }, [confirmPassword])

  const toggleConfirmPasswordVisibility = () => {
    if (confirmPassword.length > 0) {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }
  // Confirm Password Functionality <--

  // Register Access -->
  const isFormValid = email && password && confirmPassword && 
    isValidEmail(email) && password === confirmPassword &&
    passwordCriteria.every(criteria => criteria.isValid)
  // Register Access <--

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

        <div className={`${ email && !isValidEmail(email) ? 'mb-2' : 'mb-6'} flex flex-col`}>
            <label className="mb-2 font-semibold">Email</label>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`bg-transparent border border-zinc-800 rounded-lg px-4 py-3
              placeholder:text-ff-googlebtn placeholder:opacity-50
              hover:shadow-input duration-150 
              ${!isValidEmail(email) && email ? 
                'focus:shadow-input-error' : 'focus:shadow-input'
              }`} 
              type="email"
            />
            {!isValidEmail(email) && email && (
              <p className="text-red-500 text-sm mt-2">Invalid email format</p>
            )}
        </div>

        <div className={`${password ? 'mb-0' : 'mb-6'} flex flex-col`}>
            <label className="mb-2 font-semibold" >Password</label>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  value={password} 
                  onChange={handleChangePassword}
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

              {password && (
                <ul className="animate-dropdown pb-2">
                  <div className="w-full rounded-lg h-2.5 dark:bg-gray-200 mb-2">
                    <div 
                      className={`${progressBarColor} h-2.5 rounded-lg`}
                      style={{width: `${progressPercentage}%`, transition: `300ms`}}>
                    </div>
                  </div>

                  {passwordCriteria.map((criteria) => (
                    <li 
                      className="flex flex-row items-center gap-2 mb-2 text-sm" 
                      key={criteria.id} 
                      style={{color: criteria.isValid ? 'green' : 'red',}}
                    >
                      <FontAwesomeIcon icon={faCheck} /> 
                      {criteria.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-semibold" >Confirm Password</label>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}  
                  className={
                  `bg-transparent w-80 border border-zinc-800 rounded-lg px-4 py-3
                  placeholder:text-ff-googlebtn placeholder:opacity-50
                  hover:shadow-input duration-150 
                  ${password !== confirmPassword && confirmPassword ? 
                    'focus:shadow-input-error' : 'focus:shadow-input'
                  }`} 
                  type={showConfirmPassword ? 'text' : 'password'} 
                />
                
                <FontAwesomeIcon 
                  className={
                    `absolute inset-y-0 right-0 my-auto mr-3 
                    ${confirmPassword ? 'cursor-pointer': 'cursor-not-allowed opacity-50'}`}
                    icon={showConfirmPassword ? faEyeSlash : faEye} 
                    onClick={toggleConfirmPasswordVisibility}
                />
              </div>
              
              {confirmPassword && password != confirmPassword && (
                <p className="text-red-500 text-sm animate-dropdown">Password does not match</p>
              )}
            </div>

        </div>

        <button 
          className={
            `rounded-lg border border-ff-btn px-2 py-3 font-medium bg-ff-btn mt-6
            ${!isFormValid ? 
              'opacity-50 cursor-not-allowed': 
              'hover:bg-ff-bg hover:border-ff-googlebtn duration-300'
            }`}
          disabled={!isFormValid}
        >
          Register
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
      <p>No account? <Link to="/" className="text-ff-blue underline">Login</Link></p>
    </div>
  )
}
