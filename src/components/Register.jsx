import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithPopup } from "firebase/auth"
import { auth, provider, db } from "../firebase-config"
import googleIcon from '../assets/google-icon.webp'
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons"
import { faCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons"
import { doc, setDoc } from "@firebase/firestore"

export default function Register() {
  let navigate = useNavigate()
  const [username, setUsername] = useState('')
  
  // empty username error >>
  const [usernameError, setUsernameError] = useState(false)

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    if (e.target.value.trim() === '') {
      setUsernameError(true)
    } else {
      setUsernameError(false)
    }
  }

  const usernameClass = usernameError ? 'shadow-input-error' : 'focus:shadow-input'
  // <<

  // email functions >>
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(false)
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setEmailError(!isValidEmail(e.target.value))
  }
  const emailClass = emailError ? 'shadow-input-error' : 'focus:shadow-input'
  // <<

  // Google sign in >>
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider); 
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home")
      } else {
        navigate("/register")
      }
    })
    return () => unsubscribe()
  }, [navigate])
  // <<

  // Password functionality >>
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  
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
    if (e.target.value.trim() === '') {
      setPasswordError(true)
    } else {
      setPasswordError(false)
    }
  }
  // <<

  // Password criteria >>
  const passwordCriteria = [
    { 
      id: 'minLength', 
      text: 'Minim 6 caractere', 
      isValid: password.length >= 6 
    },
    { 
      id: 'specialChar', 
      text: 'Minim un caracter special (!@#$%^&*().)', 
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
    },
    { 
      id: 'upperCase',
      text: 'Minim o majuscula',
      isValid: /[A-Z]/.test(password) },
      { 
        id: 'number', 
        text: 'Minim un numar', 
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
    // <<
    
    // Confirm Password Functionality >>
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [confirmPasswordError, setConfirmPasswordError] = useState(false)

    const handleConfirmPasswordChange = (e) => {
      setConfirmPassword(e.target.value)
      if(e.target.value.trim() === '') {
        setConfirmPasswordError(true)
      } else {
        setConfirmPasswordError(false)
      }
    }

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
  // <<

  // Register Access and account creation >>
  const isFormValid = username && email && password && confirmPassword && 
    isValidEmail(email) && password === confirmPassword &&
    passwordCriteria.every(criteria => criteria.isValid)

    const handleRegister = async (e) => {
      e.preventDefault()
      if(isFormValid) {
        try {
         const userCredential = await createUserWithEmailAndPassword(auth, email, password)
         const user = userCredential.user

         await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          username: username,
          email:email,
          admin: false,
         })

         setUsername('')
         setEmail('')
         setPassword('')
         setConfirmPassword('')
        } catch (error) {
          console.error("Error signing up: ", error)
        }
      }
    }
  // <<

  return (
    <div className="flex flex-col items-center justify-center bg-ff-bg w-screen h-screen gap-5">
      <h1 className="font-medium text-4xl mb-6">
        Alătură-te 
        <span className="text-ff-flavor"> Flavor</span>
        <span className="text-ff-folio">Folio</span>
      </h1>

      <form className="flex flex-col w-80">
        <div className="flex flex-col mb-6">
            <label className="mb-2 font-semibold">Nume utilizator</label>

            <div className="flex flex-col relative">
              <input 
                value={username}
                onChange={handleUsernameChange}
                onBlur={() => setUsernameError(username.trim() === '')}
                className={`bg-transparent border border-zinc-800 rounded-lg px-4 py-3
                placeholder:text-ff-googlebtn placeholder:opacity-50
                hover:shadow-input duration-150 ${usernameClass}`} 
                type="text"
              />

              {usernameError && (
                <FontAwesomeIcon 
                  icon={faCircleExclamation}
                  className="absolute inset-y-0 right-0 my-auto mr-3 text-red-500"
                />
              )}
            </div>
        </div>

        <div className={`${ email && !isValidEmail(email) ? 'mb-2' : 'mb-6'} flex flex-col`}>
            <label className="mb-2 font-semibold">Email</label>

            <div className="relative flex flex-col">
              <input 
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setEmailError(!isValidEmail(email))}
                className={`bg-transparent border border-zinc-800 rounded-lg px-4 py-3
                placeholder:text-ff-googlebtn placeholder:opacity-50
                hover:shadow-input duration-150 
                ${emailClass}`} 
                type="email"
              />

              {emailError && (
                <FontAwesomeIcon
                icon={faCircleExclamation}
                className={`absolute inset-y-0 right-0 my-auto mr-3 text-red-500
                  ${!isValidEmail(email) && email ? "-top-7" : "top-0"}`
                } />
              )}

              {!isValidEmail(email) && email && (
                <p className="text-red-500 text-sm mt-2">Invalid email format (name@company.com)</p>
              )}
            </div>
        </div>

        <div className={`${password ? 'mb-0' : 'mb-6'} flex flex-col`}>
            <label className="mb-2 font-semibold" >Parolă</label>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  value={password} 
                  onChange={handleChangePassword}
                  onBlur={() => 
                    setPasswordError(!passwordCriteria.every(criteria => criteria.isValid)
                  )}
                  placeholder="6+ caractere" 
                  className={`bg-transparent w-80 border border-zinc-800 rounded-lg pr-10 pl-4 py-3 
                  placeholder:text-ff-googlebtn placeholder:opacity-50
                  hover:shadow-input duration-150 ${passwordError ? 'shadow-input-error' : 'focus:shadow-input'}
                  `} 
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
          <label className="mb-2 font-semibold" >Confirmă parola</label>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={() => 
                    setConfirmPasswordError(password !== confirmPassword || confirmPassword === "")
                  }
                  className={
                  `bg-transparent w-80 border border-zinc-800 rounded-lg pl-4 pr-10 py-3
                  placeholder:text-ff-googlebtn placeholder:opacity-50
                  hover:shadow-input duration-150 
                  ${confirmPasswordError ? 'shadow-input-error' : 'focus:shadow-input'}`} 
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
                <p className="text-red-500 text-sm animate-dropdown">Parola nu se potrivește</p>
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
          onClick={handleRegister}
        >
          Înregistrare
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
      <p>Ai deja un cont? <Link to="/" className="text-ff-blue underline">Loghează-te</Link></p>
    </div>
  )
}
