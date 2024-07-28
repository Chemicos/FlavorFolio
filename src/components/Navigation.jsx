/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import FlavorFolioLogo from '../assets/FlavorFolio_logo1.png'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs } from '@firebase/firestore'
import { db } from "../firebase-config"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket, faChartPie, faEnvelope, faGear, faHourglassStart, faMoon, faSun, faUser } from '@fortawesome/free-solid-svg-icons'
import Notifications from './Notifications'

export default function Navigation({ onFeedbackClick }) {
    const navigate = useNavigate()
    const auth = getAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [username, setUsername] = useState('')
    const [userPhoto, setUserPhoto] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const dropdownRef = useRef(null)
    const [pendingCount, setPendingCount] = useState(0)
    const [feedbackCount, setFeedbackCount] = useState(0)
    const [isDarkMode, setIsDarkMode] = useState(false)

    useEffect(() => {
      const fetchPendingCount = async () => {
        const pendingCollection = collection(db, 'pendingRecipes')
        const pendingSnapshot = await getDocs(pendingCollection)
        setPendingCount(pendingSnapshot.size)
      }

      const fetchFeedbackCount = async () => {
        const feedbackCollection = collection(db, 'feedbacks')
        const feedbackSnapshot = await getDocs(feedbackCollection)
        setFeedbackCount(feedbackSnapshot.size)
      }

      if (isAdmin) {
        fetchPendingCount()
        fetchFeedbackCount()
      }
    }, [isAdmin])
    
  // Retrieving username & avatar from users or google and remaining connected >>
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const uid = user.uid
          const userRef = doc(db, 'users', uid)
          const docSnap = await getDoc(userRef)
          if (docSnap.exists()) {
            const userData = docSnap.data()
            setUsername(userData.username || user.displayName)
            setIsAdmin(userData.admin)
            setUserPhoto(userData.profileImage || user.photoURL || '')
          } else {
            setUsername(user.displayName)
            setUserPhoto(user.photoURL || '')
          } 
        } else {
          setUsername('')
          setUserPhoto('')
          navigate("/")
        }
      })
      return () => unsubscribe()
  }, [navigate, auth])
  // <<

  useEffect(() => {
    const closeDropdown = (e) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
    }
    }
    document.addEventListener('mousedown', closeDropdown);
      return () => document.removeEventListener('mousedown', closeDropdown);
  }, [isOpen])

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
        localStorage.setItem('darkMode', newDarkMode)
        if (newDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
  }
    
    const handleSignOut = () => {
        signOut(auth).then(() => 
        navigate("/")).catch((error) => 
        console.error("Sign out error", error))
    }
  return (
    <nav className="bg-transparent">
      <div className="px-4 lg:px-10 shadow-sm dark:shadow-none dark:border-b-[1px] dark:border-dark-border dark:border-opacity-20">
        <div className="flex justify-between h-16">
            <Link to="/home" className="flex items-center gap-4 duration-150 hover:scale-110">
              <img className="block h-12 w-10" src={FlavorFolioLogo} alt="FlavorFolioLogo" />
              <p className='text-ff-flavor font-semibold italic text-xl'>
                Flavor
                <span className='text-ff-folio'>Folio</span>
              </p>
            </Link>
            
          <div className="flex items-center">
            <button className=''
              onClick={toggleDarkMode}
            >
              <FontAwesomeIcon className='dark:text-dark-border dark:hover:text-dark-btn' icon={isDarkMode ? faSun : faMoon} />
            </button>

            <div className="ml-3 relative">
              <div className='flex flex-row items-center gap-3 md:px-4 md:py-1 md:rounded-lg md:bg-ff-content dark:md:bg-dark-elements'>
                <Notifications />

                <button type="button" 
                  className="max-w-xs flex gap-4 items-center text-sm focus:outline-none" 
                  id="user-menu-button" 
                  aria-expanded="false" 
                  aria-haspopup="true" 
                  onClick={() => setIsOpen(!isOpen)}
                  >
                  <span className='text-base duration-150 hidden md:flex hover:scale-110 dark:text-dark-btn'>
                    {username}
                  </span>

                  {userPhoto && 
                    <img src={userPhoto} className='w-10 h-10 rounded-full' alt="Profile" />  
                  }
                </button>
              </div>

              {isOpen && (
                <div ref={dropdownRef} 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md z-10
                  shadow-lg py-1 bg-white dark:bg-dark-bg dark:border-dark-border dark:border 
                  ring-1 ring-black ring-opacity-5 focus:outline-none
                  " 
                  role="menu" 
                  aria-labelledby="user-menu-button"
                >
                  <a href="#" 
                    className="flex flex-row gap-3 px-4 py-2 items-center text-sm text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements 
                    duration-150" 
                    role="menuitem"
                    onClick={() => navigate('/profile')}>
                      <FontAwesomeIcon icon={faUser} />
                      Profilul Meu
                  </a>

                  {isAdmin && (
                    <>
                      <a
                        href="#"
                        className="flex flex-row gap-3 px-4 py-2 text-sm items-center text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements 
                        duration-150"
                        role="menuitem"
                        onClick={() => navigate('/pending')}
                      >
                        <FontAwesomeIcon icon={faHourglassStart} />
                        În Așteptare
                        {pendingCount > 0 && (
                          <span className='bg-red-600 text-white rounded-full font-semibold px-2 py-1 my-auto text-xs'>
                            {pendingCount}
                          </span>  
                        )}
                      </a>

                      <a 
                        href="#"
                        className="flex flex-row gap-3 px-4 py-2 text-sm items-center text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements 
                        duration-150"
                        role="menuitem"
                        onClick={() => navigate('/dashboard')}
                      >
                        <FontAwesomeIcon icon={faChartPie} />
                        Date
                      </a>

                      <a
                        href="#"
                        className="flex flex-row gap-3 px-4 py-2 text-sm items-center text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements 
                        duration-150"
                        role="menuitem"
                        onClick={() => navigate('/manage-feedback')}
                      >
                        <FontAwesomeIcon icon={faEnvelope} />
                          Feedbacks
                        {feedbackCount > 0 && (
                          <span className='bg-red-600 text-white rounded-full font-semibold px-2 py-1 my-auto text-xs'>
                            {feedbackCount}
                          </span>  
                        )}
                      </a>
                    </>
                  )}

                  <a href="#" 
                    className="flex flex-row gap-3 px-4 py-2 items-center text-sm text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements 
                    duration-150" 
                    role="menuitem"
                    onClick={() => navigate('/settings')}
                  >
                    <FontAwesomeIcon icon={faGear} />
                    Setări
                  </a>

                  {!isAdmin && (
                    <a href="#"
                      className='flex flex-row gap-3 px-4 py-2 items-center text-sm text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements
                      duration-150'
                      role="menuitem"
                      onClick={() => onFeedbackClick()}
                    >
                      <FontAwesomeIcon icon={faEnvelope} />
                      Feedback
                    </a>
                  )}
                  
                  <a href="#" 
                    className="flex flex-row gap-3 px-4 py-2 items-center text-sm text-gray-700 dark:text-dark-border hover:bg-gray-100 dark:hover:bg-dark-elements 
                    duration-150" 
                    role="menuitem" 
                    onClick={handleSignOut}>
                      <FontAwesomeIcon icon={faArrowRightFromBracket} />
                      Sign Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
