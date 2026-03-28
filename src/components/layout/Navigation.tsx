/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import FlavorFolioLogo from '../../assets/FF_logo.png'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs } from '@firebase/firestore'
import { db } from "../../firebase-config"
// import Notifications from './Notifications'

import {motion} from "motion/react"
import PostAddIcon from '@mui/icons-material/PostAdd'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import UserDropdownMenu from './UserDropdownMenu'

interface NavigationProps {
  onFeedbackClick?: () => void
}

interface FirestoreUser {
  username?: string
  admin?: boolean
  profileImage?: string
}

export default function Navigation({ onFeedbackClick }: NavigationProps) {
    const navigate = useNavigate()
    const auth = getAuth()

    const [username, setUsername] = useState('')
    const [userPhoto, setUserPhoto] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [feedbackCount, setFeedbackCount] = useState(0)
    const [isDarkMode, setIsDarkMode] = useState(false)

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const menuOpen = Boolean(anchorEl)
    const [isScrolled, setIsScrolled] = useState(false)

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
            setIsAdmin(Boolean(userData.admin))
            setUserPhoto(userData.profileImage || user.photoURL || '')
          } else {
            setUsername(user.displayName || '')
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY !== 0)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
        localStorage.setItem('darkMode', String(newDarkMode))

        if (newDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path: string) => {
    handleMenuClose()
    navigate(path)
  }
    
  const handleSignOut = async () => {
    try {
      handleMenuClose()
      await signOut(auth)
      navigate("/")
    } catch (error) {
      console.error("Sign out error", error)
    }
      // signOut(auth).then(() => 
      // navigate("/")).catch((error) => 
      // console.error("Sign out error", error))
  }

  const handleFeedbackMenuClick = () => {
    handleMenuClose()

    if(isAdmin) {
      navigate("/manage-feedback")
      return
    }

    onFeedbackClick?.()
  }
  return (
    <div className='fixed left-0 top-0 z-50 w-full'>
      <div className='w-full px-0'>
        <motion.nav 
          initial={false}
          animate={
            isScrolled
            ? {
              width: "100%",
              marginTop: 0,
              borderRadius: "0px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }
            : {
              width: "90%",
              marginTop: 16,
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            }
          }
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={[
            "mx-auto flex h-20 items-center justify-between px-4 lg:px-8 transition-colors duration-300",
            isScrolled
              ? "bg-[#0b0b0c]/80 backdrop-blur-md"
              : "bg-[#0b0b0c]",
          ].join(" ")}
        >
          
            <Link
              to="/home"
              className='flex items-center transition duration-200 hover:scale-[1.03]'
            >
              <img 
                className='h-10 w-auto object-contain'
                src={FlavorFolioLogo}
                alt='FlavorFolioLogo'
              />
            </Link>

            <div className='flex items-center gap-4 lg:gap-6'>
              <button
                type='button'
                className='hidden sm:flex items-center gap-2 text-white/80  hover:text-white transition'
              >
                {/* <PostAddIcon sx={{ fontSize: 20 }} /> */}
                <span className='text-[15px] font-medium'>New post</span>
              </button>

              <button
                type='button'
                onClick={toggleDarkMode}
                className='flex h-8 w-14 items-center rounded-full border border-[#3f424a]/80 bg-[#0b0b0c] px-1 transition'
              >
                <span  className={["flex h-6 w-6 items-center justify-center rounded-full text-white transition-transform duration-300",
                  isDarkMode ? "translate-x-6" : "translate-x-0",
                ].join(" ")}>
                {isDarkMode ? 
                  <DarkModeIcon sx={{ fontSize: 20}} /> 
                  : 
                  <LightModeIcon sx={{ fontSize: 20}} />
                }
                </span>
              </button>

              <button>
                <NotificationsIcon sx={{fontSize: 25, color: "#a8b3cf"}} />
              </button>

              <div className='relative'>
                <button
                  type='button'
                  id='user-menu-button'
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  className='flex items-center gap-3 rounded-2xl bg-[#16181d] px-3 py-2 pr-4 transition hover:bg-[#202429]'
                >
                  {userPhoto && (
                    <img src={userPhoto} className='h-12 w-12 rounded-xl object-cover' alt="profile" />
                  )}

                  <div className='hidden min-w-[110px] text-left md:block'>
                    <p className='truncate font-semibold text-white'>{username}</p>
                    <p className='text-[12px] text-[#a8b3cf]/80'>
                      {isAdmin ? "Admin" : "Member"}
                    </p>
                  </div>
                  
                  <motion.div
                    animate={{rotate: menuOpen ? 180 : 0}}
                    transition={{
                      duration: 0.20,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    className='flex items-center justify-center'
                  >
                    <ExpandMoreIcon sx={{fontSize: 30, color: "#a8b3cf"}} />
                  </motion.div>
                </button>

                <UserDropdownMenu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  onProfile={() => handleNavigate("/profile")}
                  onPending={() => handleNavigate("/pending")}
                  onNeedsRevision={() => handleNavigate("/needs-revision")}
                  onDashboard={() => handleNavigate("/dashboard")}
                  onFeedbacks={handleFeedbackMenuClick}
                  onSettings={() => handleNavigate("/settings")}
                  onSignOut={handleSignOut}
                  isAdmin={isAdmin}
                  pendingCount={pendingCount}
                  feedbackCount={feedbackCount}
                />
              </div>
            </div>
          
        </motion.nav>
      </div>
    </div>
  )
}
