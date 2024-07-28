import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons"
import { faCheck } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { useEffect, useState } from "react"


export default function AccountManagement() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState(false)

  const auth = getAuth()
  const user = auth.currentUser

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
      isValid: /[A-Z]/.test(password) 
    },
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

  const toggleCurrentPasswordVisibility = () => {
    if (currentPassword.length > 0) {
      setShowCurrentPassword(!showCurrentPassword)
    }
  }

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value)
  }

  const isFormValid = 
    currentPassword &&
    password && 
    confirmPassword && 
    password === confirmPassword &&
    passwordCriteria.every(criteria => criteria.isValid)

  const handleSave = async (e) => {
    e.preventDefault()
    if (isFormValid && user) {
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        
        await reauthenticateWithCredential(user, credential) // Reauthenticate the user
        await updatePassword(user, password)
        console.log('Password updated successfully!')
      } catch (error) {
        console.error("Error updating password: ", error)
      }
    }
  }

  return (
    <div className="w-[600px] flex flex-col gap-6 px-4">
        <h2 className="text-xl font-semibold dark:text-dark-border">Gestionarea contului</h2>
        <h1 className="text-lg font-semibold dark:text-dark-border">
          Schimbarea parolei
        </h1>

        <form className="flex flex-col">
          <div className="flex flex-col mb-6">
            <label className="mb-2 font-semibold dark:text-dark-border">Parola Curentă</label>
            <div className="relative">
              <input
                value={currentPassword}
                onChange={handleCurrentPasswordChange}
                placeholder="Parola curentă"
                className={`bg-transparent w-full border border-zinc-800 rounded-lg pr-10 pl-4 py-3 
                placeholder:text-ff-googlebtn dark:placeholder:text-dark-border placeholder:opacity-50 duration-150 focus:shadow-input dark:shadow-none 
                dark:hover:border-opacity-100 dark:border-dark-border dark:border-opacity-40 dark:focus:border-opacity-100 dark:text-white hover:shadow-input`}
                type={showCurrentPassword ? 'text' : 'password'}
              />
              <FontAwesomeIcon
                className={
                  `absolute inset-y-0 right-0 my-auto mr-3 dark:text-dark-border
                  ${currentPassword ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`
                }
                icon={showCurrentPassword ? faEyeSlash : faEye}
                onClick={toggleCurrentPasswordVisibility}
              />
            </div>
          </div>

          <div className={`${password ? 'mb-0' : 'mb-6'} flex flex-col`}>
            <label className="mb-2 font-semibold dark:text-dark-border">Parola Nouă</label>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  value={password} 
                  onChange={handleChangePassword}
                  onBlur={() => 
                    setPasswordError(!passwordCriteria.every(criteria => criteria.isValid)
                  )}
                  placeholder="6+ caractere" 
                  className={`bg-transparent w-full border border-zinc-800 rounded-lg pr-10 pl-4 py-3 
                placeholder:text-ff-googlebtn dark:placeholder:text-dark-border placeholder:opacity-50 duration-150 focus:shadow-input dark:shadow-none 
                dark:hover:border-opacity-100 dark:border-dark-border dark:border-opacity-40 dark:focus:border-opacity-100 dark:text-white hover:shadow-input
                ${passwordError ? 'shadow-input-error' : 'focus:shadow-input hover:shadow-input'}
                  `} 
                  type={showPassword ? 'text' : 'password'} 
                />

                <FontAwesomeIcon
                  className={
                    `absolute inset-y-0 right-0 my-auto mr-3 dark:text-dark-border
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
                      style={{color: criteria.isValid ? 'rgb(74 222 128)' : 'rgb(239 68 68)',}}
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
            <label className="mb-2 font-semibold dark:text-dark-border">Confirmă Parola</label>

              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={() => 
                      setConfirmPasswordError(password !== confirmPassword || confirmPassword === "")
                    }
                    className={
                    `bg-transparent w-full border border-zinc-800 rounded-lg pr-10 pl-4 py-3 
                  placeholder:text-ff-googlebtn dark:placeholder:text-dark-border placeholder:opacity-50 duration-150 focus:shadow-input dark:shadow-none 
                    dark:hover:border-opacity-100 dark:border-dark-border dark:border-opacity-40 dark:focus:border-opacity-100 dark:text-white hover:shadow-input
                    ${confirmPasswordError ? 'shadow-input-error' : 'focus:shadow-input hover:shadow-input'}`} 
                    type={showConfirmPassword ? 'text' : 'password'} 
                  />
                  
                  <FontAwesomeIcon 
                    className={
                      `absolute inset-y-0 right-0 my-auto mr-3 dark:text-dark-border 
                      ${confirmPassword ? 'cursor-pointer': 'cursor-not-allowed opacity-50'}`}
                      icon={showConfirmPassword ? faEyeSlash : faEye} 
                      onClick={toggleConfirmPasswordVisibility}
                  />
                </div>
                
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-sm animate-dropdown">Parola nu se potrivește</p>
                )}
              </div>
          </div>

          <button 
            className={`rounded-lg border-ff-btn px-2 py-3 font-semibold mt-6
            ${isFormValid ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-ff-btn bg-opacity-50 cursor-not-allowed'}`}
            disabled={!isFormValid}
            onClick={handleSave}
          >
            Salvează
          </button>
        </form>
    </div>
  )
}
